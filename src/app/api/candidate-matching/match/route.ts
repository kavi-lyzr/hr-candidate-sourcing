import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/user';
import JobDescription from '@/models/jobDescription';
import { decrypt, chatWithLyzrAgent } from '@/lib/lyzr-services';

export const maxDuration = 180; // 3 minutes for matching

export async function POST(request: Request) {
    try {
        // 1. Validate authentication token
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.API_AUTH_TOKEN;
        
        if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        // 2. Parse request body
        const { jobDescription, candidates, user } = await request.json();
        
        if (!jobDescription || !candidates || !user) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!Array.isArray(candidates) || candidates.length === 0) {
            return NextResponse.json({ error: 'At least one candidate is required' }, { status: 400 });
        }

        // 3. Connect to DB and fetch user
        await connectDB();
        const dbUser = await User.findOne({ lyzrUserId: user.id });
        
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        // 4. Verify job description exists
        const jdId = jobDescription.id || jobDescription._id;
        
        if (!jdId) {
            return NextResponse.json({ error: 'Job description ID is required' }, { status: 400 });
        }
        
        const jd = await JobDescription.findById(jdId);
        
        if (!jd) {
            return NextResponse.json({ error: 'Job description not found' }, { status: 404 });
        }

        // 5. Prepare system prompt variables for the matching agent
        const systemPromptVariables = {
            user_name: user.name || user.email?.split('@')[0] || 'User',
            job_description: jd.content,
            candidate_profiles: JSON.stringify(candidates.map(candidate => ({
                candidate_id: candidate.id,
                public_id: candidate.public_id,
                full_name: candidate.name,
                job_title: candidate.title,
                company: candidate.company,
                location: candidate.location,
                about: candidate.summary,
                years_of_experience: candidate.years_of_experience,
                education: candidate.education || [],
                company_logo_url: candidate.companyLogo || ''
            }))),
            datetime: new Date().toISOString(),
        };

        // 6. Decrypt API key and call matching agent
        const apiKey = decrypt(dbUser.lyzrApiKey);


        const chatResponse = await chatWithLyzrAgent(
            apiKey,
            dbUser.matchingAgent.agentId,
            `Please rank these ${candidates.length} candidates against the job description.`, // Simple message since context is in system variables
            user.email || user.id,
            systemPromptVariables
        );


        // 7. Parse the structured response
        let rankedCandidates;
        try {
            // The response should be a JSON string with the structured output
            const responseData = JSON.parse(chatResponse.response);
            rankedCandidates = responseData.ranked_candidates || [];
            
            // Enrich with candidate data
            rankedCandidates = rankedCandidates.map((ranked: any) => {
                const candidateData = candidates.find(c => c.id === ranked.candidate_id);
                return {
                    ...ranked,
                    candidate_data: candidateData
                };
            });
        } catch (parseError) {
            console.error('Failed to parse matching agent response:', parseError);
            return NextResponse.json({ 
                error: 'Failed to parse matching results',
                details: 'The AI agent returned an invalid response format'
            }, { status: 500 });
        }

        // 8. Return ranked candidates
        return NextResponse.json({
            success: true,
            rankedCandidates,
            totalCandidates: candidates.length,
            message: 'Candidates successfully ranked'
        });

    } catch (error: any) {
        console.error('Error in candidate matching:', error);
        return NextResponse.json({
            error: 'Failed to match candidates',
            details: error.message
        }, { status: 500 });
    }
}
