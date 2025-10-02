import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/lyzr-services';
import { performLinkedInSearch, formatProfileForLLM, calculateYearsOfExperience, type LinkedInSearchParams } from '@/lib/linkedin-api';
import { availableLocations } from '@/lib/locations';
import connectDB from '@/lib/db';
import CandidateProfile from '@/models/candidateProfile';
import User from '@/models/user';
import SearchSession from '@/models/searchSession';

export const maxDuration = 180; // Set timeout to 3 minutes for this API route
const MAX_LIMIT = 50;

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

        console.log(`LinkedIn search completed. Found ${searchResults.data.length} candidates out of ${searchResults.total_count || 0} total available.`);

        // 7. Connect to DB and store profiles
        console.log('Connecting to database...');
        await connectDB();
        console.log('Database connected successfully');

        const formattedProfiles = [];
        const allProfiles = []; // Store all profiles for frontend communication
        let storedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        
        console.log(`Processing ${searchResults.data.length} profiles for storage...`);
        
        for (let i = 0; i < searchResults.data.length; i++) {
            const profile = searchResults.data[i];
            console.log(`[${i + 1}/${searchResults.data.length}] Processing profile: ${profile.full_name || 'Unknown'}`);
            
            // Skip profiles without public_id
            if (!profile.public_id) {
                console.warn(`  ⚠️  Skipping: No public_id for ${profile.full_name || 'Unknown'}`);
                skippedCount++;
                continue;
            }

            try {
                // Check if profile exists, if not create it
                let candidateProfile = await CandidateProfile.findOne({ publicId: profile.public_id });
                
                if (!candidateProfile) {
                    candidateProfile = new CandidateProfile({
                        publicId: profile.public_id,
                        rawData: profile,
                        lastFetchedAt: new Date(),
                    });
                    await candidateProfile.save();
                    console.log(`  ✅ Stored NEW profile: ${profile.full_name} (${profile.public_id})`);
                    storedCount++;
                } else {
                    // Update existing profile
                    candidateProfile.rawData = profile;
                    candidateProfile.lastFetchedAt = new Date();
                    await candidateProfile.save();
                    console.log(`  ♻️  Updated EXISTING profile: ${profile.full_name} (${profile.public_id})`);
                    updatedCount++;
                }
            } catch (saveError: any) {
                console.error(`  ❌ FAILED to save profile ${profile.full_name}:`, {
                    error: saveError.message,
                    code: saveError.code,
                    name: saveError.name
                });
                skippedCount++;
                // Continue with next profile
                continue;
            }

            // Format for LLM (concise version for agent)
            const formatted = formatProfileForLLM(profile);
            formattedProfiles.push(formatted);

            // Store full profile data for frontend communication
            allProfiles.push({
                public_id: profile.public_id,
                full_name: profile.full_name,
                job_title: profile.job_title,
                company: profile.company,
                location: profile.location,
                linkedin_url: profile.linkedin_url,
                profile_image_url: profile.profile_image_url,
                company_logo_url: profile.company_logo_url,
                headline: profile.headline,
                about: profile.about?.substring(0, 200) || '',
                years_of_experience: calculateYearsOfExperience(profile),
                education: profile.educations?.slice(0, 1).map(edu => ({
                    degree: edu.degree,
                    field: edu.field_of_study,
                    school: edu.school,
                })) || [],
            });
        }

        console.log(`\n📊 Profile processing complete:`);
        console.log(`   - New profiles stored: ${storedCount}`);
        console.log(`   - Existing profiles updated: ${updatedCount}`);
        console.log(`   - Profiles skipped: ${skippedCount}`);
        console.log(`   - Total processed: ${formattedProfiles.length}\n`);

        // 8. Generate AI summaries for profiles
        // Connect to user to get their profile summary agent (if we implement this feature)
        // For now, we'll return profiles with basic info and let the sourcing agent handle summarization

        console.log(`Successfully processed ${formattedProfiles.length} candidates`);

        // 8. Store results in database for retrieval by chat endpoint
        try {
            const session = await SearchSession.findById(session_id);
            if (session) {
                session.toolResults = {
                    allProfiles,
                    timestamp: new Date(),
                };
                await session.save();
                console.log(`✅ Stored ${allProfiles.length} profiles in database for session: ${session_id}`);
            } else {
                console.warn(`⚠️  Session ${session_id} not found in database. Results will still be returned to agent.`);
            }
        } catch (dbError: any) {
            console.error('❌ Failed to store results in database:', dbError.message);
            // Don't fail the tool call, just log the error
        }

        // 9. Return formatted profiles for agent + all profiles for frontend
        return NextResponse.json({ 
            success: true, 
            message: `Found ${formattedProfiles.length} candidates matching your criteria.`,
            total_count: searchResults.total_count,
            total_fetched: allProfiles.length,
            total_stored: storedCount,
            total_updated: updatedCount,
            total_skipped: skippedCount,
            data: formattedProfiles, // Concise data for agent
            all_profiles: allProfiles, // Full data for frontend display
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
