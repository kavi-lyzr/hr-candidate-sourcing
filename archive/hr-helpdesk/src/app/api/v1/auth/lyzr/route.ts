import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateUser, type LyzrUserData } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lyzrUserData } = body as { lyzrUserData: LyzrUserData };

    if (!lyzrUserData || !lyzrUserData.id || !lyzrUserData.email) {
      return NextResponse.json(
        { error: 'Invalid user data provided' },
        { status: 400 }
      );
    }

    // Create or update user in our database
    const user = await createOrUpdateUser(lyzrUserData);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currentOrganization: user.currentOrganization,
      },
    });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
