import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/user';
import CandidateProfile from '@/models/candidateProfile';
import SavedProfile from '@/models/savedProfile';
import SearchSession from '@/models/searchSession';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.API_AUTH_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { candidatePublicId, sessionId, user: userInfo } = await request.json();

    if (!candidatePublicId || !sessionId || !userInfo || !userInfo.id) {
      return NextResponse.json({ error: 'Missing required parameters (candidatePublicId, sessionId, or user)' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ lyzrUserId: userInfo.id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const candidate = await CandidateProfile.findOne({ publicId: candidatePublicId });
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 });
    }
    
    const searchSession = await SearchSession.findById(sessionId);
    if (!searchSession) {
        return NextResponse.json({ error: 'Search session not found' }, { status: 404 });
    }

    const existingSavedProfile = await SavedProfile.findOne({
      user: user._id,
      candidate: candidate._id,
      searchSession: searchSession._id,
    });

    if (existingSavedProfile) {
      // Unsave the profile
      await SavedProfile.findByIdAndDelete(existingSavedProfile._id);
      return NextResponse.json({ success: true, saved: false, message: 'Profile removed from saved list.' });
    } else {
      // Save the profile
      const newSavedProfile = new SavedProfile({
        user: user._id,
        candidate: candidate._id,
        searchSession: searchSession._id,
      });
      await newSavedProfile.save();
      return NextResponse.json({ success: true, saved: true, message: 'Profile saved successfully.' });
    }
  } catch (error) {
    console.error('Error toggling saved profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
