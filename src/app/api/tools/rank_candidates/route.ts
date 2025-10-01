import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Received call to /api/tools/rank_candidates with body:', body);

        // In the future, this will perform the actual ranking.
        // For now, return mock data.

        const rankedCandidates = body.candidate_profiles.map((candidate: any, index: number) => ({
            ...candidate,
            rank: index + 1,
            score: (100 - index * 10),
            summary: `This candidate is a strong fit because of their experience in roles like '${candidate.title}'. Rank is mock data.`
        })).sort((a:any, b:any) => a.rank - b.rank);

        return NextResponse.json({ 
            success: true, 
            data: rankedCandidates 
        });

    } catch (error: any) {
        console.error('Error in /api/tools/rank_candidates:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
