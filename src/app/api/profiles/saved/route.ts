import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/user';
import SavedProfile from '@/models/savedProfile';
import CandidateProfile from '@/models/candidateProfile';

// Ensure models are registered
import '@/models/candidateProfile';
import '@/models/savedProfile';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.API_AUTH_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
  }

  try {
    await connectDB();

    const user = await User.findOne({ lyzrUserId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all saved profiles for the user
    const savedProfiles = await SavedProfile.find({ user: user._id }).populate({
      path: 'candidate',
      model: CandidateProfile
    });
    
    // Extract the publicId from the populated candidate document
    const savedCandidatePublicIds = savedProfiles
      .map(sp => (sp.candidate as any)?.publicId)
      .filter(Boolean); // Filter out any null/undefined publicIds

    return NextResponse.json({ savedProfileIds: savedCandidatePublicIds });
  } catch (error) {
    console.error('Error fetching saved profiles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
