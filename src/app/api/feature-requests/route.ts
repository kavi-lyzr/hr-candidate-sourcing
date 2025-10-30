import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FeatureRequest from '@/models/featureRequests';
import User, { IUserDocument } from '@/models/user';

export async function getUserById(userId: string): Promise<IUserDocument | null> {
    await dbConnect();
    
    try {
      // First try to find by MongoDB ObjectId (24 character hex string)
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        const user = await User.findById(userId);
        if (user) return user;
      }
      
      // If not found or not a valid ObjectId, try finding by lyzrUserId
      const user = await User.findOne({ lyzrUserId: userId });
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      email,
      message,
      app,
      pagePath,
      userId,
    }: {
      email: string;
      message: string;
      app: string;
      pagePath?: string | null;
      userId?: string | null;
    } = body;

    if (!email || !message || !app) {
      return NextResponse.json(
        { success: false, error: 'Required fields: email, message, app' },
        { status: 400 }
      );
    }

    await dbConnect();

    let resolvedUserId = null as any;
    if (userId) {
      const user = await getUserById(userId);
      if (user) {
        resolvedUserId = user._id;
      }
    }

    const doc = new FeatureRequest({
      email: email.toLowerCase(),
      message,
      app,
      pagePath: pagePath || null,
      userId: resolvedUserId,
      status: 'open',
      schemaVersion: 1,
    });

    await doc.save();

    return NextResponse.json({ success: true, id: doc._id });
  } catch (error) {
    console.error('Error creating feature request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create feature request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true });
}

