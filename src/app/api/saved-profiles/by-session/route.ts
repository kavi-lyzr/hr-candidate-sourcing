import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/user';
import SavedProfile from '@/models/savedProfile';
import SearchSession from '@/models/searchSession';
import CandidateProfile from '@/models/candidateProfile';

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

    // Use aggregation to group saved profiles by searchSession
    const groupedProfiles = await SavedProfile.aggregate([
      { $match: { user: user._id } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'candidateprofiles', // The actual collection name for CandidateProfile model
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidateInfo'
        }
      },
      { $unwind: '$candidateInfo' },
      {
        $group: {
          _id: '$searchSession',
          savedProfiles: {
            $push: {
              _id: '$_id',
              savedAt: '$createdAt',
              candidate: {
                _id: '$candidateInfo._id',
                publicId: '$candidateInfo.publicId',
                fullName: '$candidateInfo.rawData.full_name',
                jobTitle: '$candidateInfo.rawData.job_title',
                company: '$candidateInfo.rawData.company',
                location: '$candidateInfo.rawData.location',
                summary: { $substr: ['$candidateInfo.rawData.about', 0, 200] },
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'searchsessions', // The actual collection name for SearchSession model
          localField: '_id',
          foreignField: '_id',
          as: 'sessionInfo'
        }
      },
      { $unwind: '$sessionInfo' },
      {
        $project: {
          _id: 0,
          sessionId: '$_id',
          query: '$sessionInfo.initialQuery',
          date: '$sessionInfo.createdAt',
          savedProfiles: '$savedProfiles',
          // Note: We don't have total results count here, can be added if needed
        }
      },
      { $sort: { date: -1 } }
    ]);

    return NextResponse.json({ sessions: groupedProfiles });

  } catch (error) {
    console.error('Error fetching saved profiles by session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
