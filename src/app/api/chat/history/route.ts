import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/user';
import SearchSession from '@/models/searchSession';

export async function GET(request: Request) {
    try {
        // Validate authentication token
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.API_AUTH_TOKEN;
        
        if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        // Get user ID from query params
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Connect to DB and fetch user
        await connectDB();
        const dbUser = await User.findOne({ lyzrUserId: userId });
        
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch all search sessions for this user, sorted by most recent
        const sessions = await SearchSession.find({ user: dbUser._id })
            .sort({ updatedAt: -1 })
            .select('_id title initialQuery conversationHistory createdAt updatedAt')
            .limit(50); // Limit to last 50 conversations

        const formattedSessions = sessions.map(session => ({
            sessionId: session._id.toString(),
            title: session.title,
            initialQuery: session.initialQuery,
            messageCount: session.conversationHistory.length,
            lastUpdated: session.updatedAt,
            createdAt: session.createdAt,
        }));

        return NextResponse.json({
            success: true,
            sessions: formattedSessions
        });

    } catch (error: any) {
        console.error('Error fetching conversation history:', error);
        return NextResponse.json({
            error: 'Failed to fetch conversation history',
            details: error.message,
        }, { status: 500 });
    }
}

