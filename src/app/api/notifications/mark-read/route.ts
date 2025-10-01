import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/notification';
import User from '@/models/user';

// Placeholder for getting user ID from the request.
async function getUserIdFromRequest(req: Request): Promise<string | null> {
    const user = await User.findOne();
    return user ? user._id.toString() : null;
}

export async function PUT(request: Request) {
    await dbConnect();
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Mark all unread notifications as read for the user
        await Notification.updateMany(
            { user: userId, read: false },
            { $set: { read: true } }
        );

        return NextResponse.json({ message: 'Notifications marked as read' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
