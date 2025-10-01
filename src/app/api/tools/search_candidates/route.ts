import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/lyzr-services';
import { performLinkedInSearch, formatProfileForLLM, type LinkedInSearchParams } from '@/lib/linkedin-api';
import { availableLocations } from '@/lib/locations';
import connectDB from '@/lib/db';
import CandidateProfile from '@/models/candidateProfile';
import User from '@/models/user';

export const maxDuration = 60; // Set timeout to 60 seconds for this API route

export async function POST(request: Request) {
    try {
        // 1. Authenticate user via x-token
        const token = request.headers.get('x-token');
        if (!token) {
            return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 });
        }

        let userId: string;
        try {
            userId = decrypt(token);
        } catch (error) {
            return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
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
            limit = 25
        } = body;

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
            limit,
        };

        console.log('Executing LinkedIn search with params:', searchParams);

        // 6. Perform LinkedIn search (3-step process)
        const searchResults = await performLinkedInSearch(searchParams);

        if (!searchResults.data || searchResults.data.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No candidates found matching the search criteria.',
                data: []
            });
        }

        // 7. Connect to DB and store profiles
        await connectDB();

        const formattedProfiles = [];
        
        for (const profile of searchResults.data) {
            // Check if profile exists, if not create it
            let candidateProfile = await CandidateProfile.findOne({ publicId: profile.public_id });
            
            if (!candidateProfile) {
                candidateProfile = new CandidateProfile({
                    publicId: profile.public_id,
                    rawData: profile,
                    lastFetchedAt: new Date(),
                });
                await candidateProfile.save();
                console.log(`Stored new profile: ${profile.full_name}`);
            } else {
                // Update existing profile
                candidateProfile.rawData = profile;
                candidateProfile.lastFetchedAt = new Date();
                await candidateProfile.save();
                console.log(`Updated existing profile: ${profile.full_name}`);
            }

            // Format for LLM
            const formatted = formatProfileForLLM(profile);
            formattedProfiles.push(formatted);
        }

        // 8. Generate AI summaries for profiles
        // Connect to user to get their profile summary agent (if we implement this feature)
        // For now, we'll return profiles with basic info and let the sourcing agent handle summarization

        console.log(`Successfully processed ${formattedProfiles.length} candidates`);

        // 9. Return formatted profiles
        return NextResponse.json({
            success: true,
            message: `Found ${formattedProfiles.length} candidates matching your criteria.`,
            total_count: searchResults.total_count,
            data: formattedProfiles
        });

    } catch (error: any) {
        console.error('Error in /api/tools/search_candidates:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to search candidates', 
            details: error.message 
        }, { status: 500 });
    }
}
