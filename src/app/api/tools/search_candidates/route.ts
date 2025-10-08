import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/lyzr-services';
import { performLinkedInSearch, formatProfileForLLM, calculateYearsOfExperience, deriveProfileId, generateProfileUrl, type LinkedInSearchParams } from '@/lib/linkedin-api';
import { availableLocations } from '@/lib/locations';
import connectDB from '@/lib/db';
import CandidateProfile from '@/models/candidateProfile';
import User from '@/models/user';
import SearchSession from '@/models/searchSession';
import { pubsub } from '@/lib/pubsub';

export const maxDuration = 180; // Set timeout to 3 minutes for this API route
const MAX_LIMIT = 30;

// Allow CORS for tool calls from Lyzr Studio
export async function OPTIONS(request: Request) {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-token',
        },
    });
}

export async function POST(request: Request) {
    console.log('\n🔧 ========== TOOL CALL RECEIVED ==========');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🌐 Request URL:', request.url);
    console.log('📋 Headers:', Object.fromEntries(request.headers.entries()));
    
    // Set CORS headers for tool calls
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-token',
    };

    try {
        // 1. Authenticate user via x-token
        const token = request.headers.get('x-token');
        if (!token) {
            console.error('❌ Missing x-token header');
            return NextResponse.json({ error: 'Missing authentication token' }, { 
                status: 401,
                headers: corsHeaders 
            });
        }
        console.log('✅ x-token header present');

        let userId: string;
        try {
            userId = decrypt(token);
        } catch (error) {
            return NextResponse.json({ error: 'Invalid authentication token' }, { 
                status: 401,
                headers: corsHeaders 
            });
        }

        // 2. Parse request body
        const body = await request.json();
        console.log('📦 Tool call body:', JSON.stringify(body, null, 2));
        
        const {
            session_id,
            keywords,
            title_keywords = [],
            current_company_names = [],
            past_company_names = [],
            geo_codes = [],
            limit = MAX_LIMIT
        } = body;

        if (!session_id) {
            console.error('❌ Missing required parameter: session_id');
            return NextResponse.json({ 
                error: 'session_id is required. The agent must pass the session_id from system context.' 
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }
        
        console.log('✅ Session ID:', session_id);

        // Cap limit to prevent overwhelming the system
        const maxLimit = Math.min(limit, MAX_LIMIT);

        // 3. Validate required parameters
        if (!keywords || typeof keywords !== 'string' || keywords.trim() === '') {
            return NextResponse.json({ 
                error: 'keywords parameter is required and must be a non-empty string' 
            }, { status: 400 });
        }

        // 4. Convert geo_codes from strings to numbers if needed
        const geoCodesNum = geo_codes.map((code: any) => {
            const parsed = parseInt(code);
            return isNaN(parsed) ? null : parsed;
        }).filter((code: any) => code !== null);

        // 5. Build LinkedIn search parameters
        const searchParams: LinkedInSearchParams = {
            keywords: keywords.trim(),
            title_keywords: title_keywords.length > 0 ? title_keywords : undefined,
            current_company_names: current_company_names.length > 0 ? current_company_names : undefined,
            past_company_names: past_company_names.length > 0 ? past_company_names : undefined,
            geo_codes: geoCodesNum.length > 0 ? geoCodesNum : undefined,
            limit: maxLimit,
        };

        console.log('Executing LinkedIn search with params:', searchParams);

        // 6. Perform LinkedIn search (3-step process)
        const searchResults = await performLinkedInSearch(searchParams);

        if (!searchResults.data || searchResults.data.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No candidates found matching the search criteria.',
                data: [],
                total_fetched: 0,
                total_available: searchResults.total_count || 0
            }, { headers: corsHeaders });
        }

        // Log LinkedIn API response
        console.log(`LinkedIn search completed. Found ${searchResults.data.length} candidates out of ${searchResults.total_count || 0} total available.`);
        
        // Warn if LinkedIn API returned more profiles than requested (API not respecting limit)
        if (searchResults.data.length > maxLimit) {
            console.warn(`⚠️  LinkedIn API returned ${searchResults.data.length} profiles but limit was ${maxLimit}. Truncating results.`);
            searchResults.data = searchResults.data.slice(0, maxLimit);
        }

        // 7. Process profiles first (synchronous, fast)
        console.log(`Processing ${searchResults.data.length} profiles...`);
        
        const formattedProfiles = [];
        const allProfiles = []; // Store all profiles for frontend communication
        const profilesForDB = []; // Collect profiles for batch DB operation
        let skippedCount = 0;
        
        for (let i = 0; i < searchResults.data.length; i++) {
            const profile = searchResults.data[i];
            
            // Derive unique ID using centralized function
            const uniqueId = deriveProfileId(profile);
            
            // Skip profiles without a usable unique ID
            if (!uniqueId) {
                console.warn(`⚠️  [${i + 1}/${searchResults.data.length}] Skipping: No ID for ${profile.full_name || 'Unknown'}`);
                skippedCount++;
                continue;
            }
            
            // Update profile with derived ID for consistency
            profile.public_id = uniqueId;

            // Format for LLM (optimized, concise version for agent)
            const formatted = formatProfileForLLM(profile);
            formattedProfiles.push(formatted);

            // Collect for batch DB operation
            profilesForDB.push({
                publicId: uniqueId,
                rawData: profile,
            });

            // Store full profile data for frontend communication
            allProfiles.push({
                public_id: uniqueId,
                full_name: profile.full_name,
                job_title: profile.job_title || '',
                company: profile.company || '',
                location: profile.location || '',
                profile_url: generateProfileUrl(profile, uniqueId), // Intelligent URL with fallback
                linkedin_url: generateProfileUrl(profile, uniqueId), // Keep for backwards compatibility
                profile_image_url: profile.profile_image_url || '',
                company_logo_url: profile.company_logo_url || '',
                headline: profile.headline || '',
                about: profile.about || '',
                years_of_experience: calculateYearsOfExperience(profile),
                education: profile.educations?.slice(0, 1).map(edu => ({
                    degree: edu.degree || '',
                    field: edu.field_of_study || '',
                    school: edu.school || '',
                })).filter(edu => edu.school) || [],
            });
        }

        console.log(`✅ Processed ${formattedProfiles.length} valid profiles, skipped ${skippedCount}`);

        // 8. Connect to database (needed for both candidate storage and session operations)
        console.log('🔄 Connecting to database...');
        await connectDB();

        // 9. Save candidate profiles to database using bulkWrite for efficiency
        // We need to await this to ensure profiles are stored before continuing
        let storedCount = 0;
        let updatedCount = 0;
        
        try {
            if (profilesForDB.length > 0) {
                console.log(`💾 Saving ${profilesForDB.length} profiles to database...`);
                
                // Use bulkWrite for better performance
                const bulkOps = profilesForDB.map(profileData => ({
                    updateOne: {
                        filter: { publicId: profileData.publicId },
                        update: {
                            $set: {
                                rawData: profileData.rawData,
                                lastFetchedAt: new Date(),
                            },
                        },
                        upsert: true,
                    },
                }));
                
                const result = await CandidateProfile.bulkWrite(bulkOps);
                storedCount = result.upsertedCount || 0;
                updatedCount = result.modifiedCount || 0;
                console.log(`✅ Database save complete: ${storedCount} new, ${updatedCount} updated`);
            }
        } catch (dbError: any) {
            console.error('❌ Failed to save profiles to database:', dbError.message);
            // Continue anyway - profiles can be saved later if needed
        }

        // 10. Store results in session for retrieval by chat endpoint
        // This is critical for the non-streaming implementation to work
        try {
            const session = await SearchSession.findById(session_id);
            if (session) {
                // SECURITY: Verify session belongs to the authenticated user
                // userId contains lyzrUserId, so we need to find user by lyzrUserId field
                const user = await User.findOne({ lyzrUserId: userId });
                if (!user || !session.user.equals(user._id)) {
                    console.error(`❌ SECURITY VIOLATION: Session ${session_id} does not belong to user ${userId}`);
                    return NextResponse.json({ 
                        error: 'Unauthorized access to session' 
                    }, { 
                        status: 403,
                        headers: corsHeaders 
                    });
                }

                // Store all profiles in session for frontend retrieval
                session.toolResults = {
                    allProfiles,
                    timestamp: new Date(),
                };
                await session.save();
                console.log(`✅ Stored ${allProfiles.length} profiles in session: ${session_id}`);

                // Note: SSE pubsub is not currently used by the frontend
                // The non-streaming implementation reads from session.toolResults instead
                // Keeping this for backwards compatibility or future use
                pubsub.publish(session_id, {
                    type: 'candidate_profiles',
                    data: allProfiles,
                });
            } else {
                console.warn(`⚠️  Session ${session_id} not found in database. Results will still be returned to agent.`);
            }
        } catch (dbError: any) {
            console.error('❌ Failed to store results in session:', dbError.message);
            // Don't fail the tool call, just log the error
        }

        // 11. Return formatted profiles for agent (concise, optimized)
        // The agent uses this data, the frontend gets allProfiles from session
        return NextResponse.json({ 
            success: true, 
            message: `Found ${formattedProfiles.length} candidates matching your criteria.`,
            total_count: searchResults.total_count,
            total_fetched: allProfiles.length,
            total_stored: storedCount,
            total_updated: updatedCount,
            total_skipped: skippedCount,
            data: formattedProfiles, // Optimized, concise data for LLM
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error in /api/tools/search_candidates:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to search candidates', 
            details: error.message 
        }, { 
            status: 500,
            headers: corsHeaders 
        });
    }
}
