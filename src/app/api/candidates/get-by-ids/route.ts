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

    const formatted = profiles.map(profile => {
      const data = profile.rawData;
      return {
        id: data.public_id,
        name: data.full_name,
        title: data.job_title || 'No title available',
        company: data.company || 'No company',
        location: data.location || 'Location not specified',
        education: data.educations?.[0]?.school || '',
        summary: data.about?.substring(0, 200) || 'No summary available',
        companyLogo: data.company_logo_url || '',
        profilePic: data.profile_image_url || '',
        linkedinUrl: data.linkedin_url || '',
        public_id: data.public_id,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch candidate details', 
      details: error.message 
    }, { status: 500 });
  }
}

