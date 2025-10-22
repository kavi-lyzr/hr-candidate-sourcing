import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SavedProfile from '@/models/savedProfile';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.API_AUTH_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    await connectDB();

    const deletedProfile = await SavedProfile.findByIdAndDelete(id);

    if (!deletedProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profile removed successfully' });
  } catch (error) {
    console.error('Error deleting saved profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
