import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import CandidateProfile from '@/models/candidateProfile';

export async function POST(request: Request) {
  try {
    const { publicIds } = await request.json();

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json({ error: 'publicIds must be a non-empty array' }, { status: 400 });
    }

    console.log(`Fetching ${publicIds.length} candidate profiles:`, publicIds);

    await connectDB();

    const profiles = await CandidateProfile.find({
      publicId: { $in: publicIds }
    });

    console.log(`Found ${profiles.length} profiles in database`);

    // Return full profile data including rawData for modal display
    const formatted = profiles.map(profile => ({
      publicId: profile.publicId,
      rawData: profile.rawData,
      lastFetchedAt: profile.lastFetchedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch candidate details', 
      details: error.message 
    }, { status: 500 });
  }
}

