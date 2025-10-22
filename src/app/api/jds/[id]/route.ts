import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import JobDescription from '@/models/jobDescription';
import User from '@/models/user';

// Get user ID from the request using lyzrUserId query parameter
async function getUserIdFromRequest(req: Request): Promise<string | null> {
    const url = new URL(req.url);
    const lyzrUserId = url.searchParams.get('userId');

    if (!lyzrUserId) {
        return null;
    }

    const user = await User.findOne({ lyzrUserId });
    return user ? user._id.toString() : null;
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const jd = await JobDescription.findOneAndDelete({ _id: id, user: userId });

        if (!jd) {
            return NextResponse.json({ error: 'Job Description not found or user not authorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Job Description deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting JD:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
