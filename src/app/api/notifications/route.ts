import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/notification';
import User from '@/models/user';

// Placeholder for getting user ID from the request.
async function getUserIdFromRequest(req: Request): Promise<string | null> {
    const user = await User.findOne();
    return user ? user._id.toString() : null;
}

export async function GET(request: Request) {
    await dbConnect();
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20);
            
        return NextResponse.json(notifications);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, type, metadata } = await request.json();
        if (!message || !type) {
            return NextResponse.json({ error: 'Message and type are required' }, { status: 400 });
        }

        const notification = new Notification({
            user: userId,
            message,
            type,
            metadata,
        });

        await notification.save();
        return NextResponse.json(notification, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
