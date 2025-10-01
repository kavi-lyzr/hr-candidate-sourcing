import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/lyzr-services';
import { performLinkedInSearch, formatProfileForLLM, calculateYearsOfExperience, type LinkedInSearchParams } from '@/lib/linkedin-api';
import { availableLocations } from '@/lib/locations';
import connectDB from '@/lib/db';
import CandidateProfile from '@/models/candidateProfile';
import User from '@/models/user';

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
            return NextResponse.json({ error: 'Missing authentication token' }, { 
                status: 401,
                headers: corsHeaders 
            });
        }

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
        console.log('Received call to /api/tools/search_candidates with body:', body);

        const {
            keywords,
            title_keywords = [],
            current_company_names = [],
            past_company_names = [],
            geo_codes = [],
            limit = MAX_LIMIT
        } = body;

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
        await connectDB();

        const formattedProfiles = [];
        const allProfiles = []; // Store all profiles for frontend communication
        let storedCount = 0;
        let skippedCount = 0;
        
        for (const profile of searchResults.data) {
            // Skip profiles without public_id
            if (!profile.public_id) {
                console.warn(`Skipping profile without public_id: ${profile.full_name || 'Unknown'}`);
                skippedCount++;
                continue;
            }

            // Check if profile exists, if not create it
            let candidateProfile = await CandidateProfile.findOne({ publicId: profile.public_id });
            
            if (!candidateProfile) {
                try {
                    candidateProfile = new CandidateProfile({
                        publicId: profile.public_id,
                        rawData: profile,
                        lastFetchedAt: new Date(),
                    });
                    await candidateProfile.save();
                    console.log(`Stored new profile: ${profile.full_name}`);
                    storedCount++;
                } catch (saveError: any) {
                    console.error(`Failed to save profile ${profile.full_name}:`, saveError.message);
                    skippedCount++;
                    // Continue with next profile
                    continue;
                }
            } else {
                // Update existing profile
                candidateProfile.rawData = profile;
                candidateProfile.lastFetchedAt = new Date();
                await candidateProfile.save();
                console.log(`Updated existing profile: ${profile.full_name}`);
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

        console.log(`Profile processing complete: ${storedCount} new profiles stored, ${skippedCount} skipped, ${formattedProfiles.length} total processed.`);

        // 8. Generate AI summaries for profiles
        // Connect to user to get their profile summary agent (if we implement this feature)
        // For now, we'll return profiles with basic info and let the sourcing agent handle summarization

        console.log(`Successfully processed ${formattedProfiles.length} candidates`);

        // 9. Return formatted profiles for agent + all profiles for frontend
        return NextResponse.json({ 
            success: true, 
            message: `Found ${formattedProfiles.length} candidates matching your criteria.`,
            total_count: searchResults.total_count,
            total_fetched: allProfiles.length,
            total_stored: storedCount,
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
