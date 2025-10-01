import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import JobDescription from '@/models/jobDescription';
import User from '@/models/user';

// Placeholder for getting user ID from the request.
async function getUserIdFromRequest(req: Request): Promise<string | null> {
    const user = await User.findOne();
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
