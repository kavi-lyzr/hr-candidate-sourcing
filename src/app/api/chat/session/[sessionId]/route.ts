import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SearchSession from '@/models/searchSession';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        // Validate authentication token
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.API_AUTH_TOKEN;
        
        if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        const { sessionId } = await params;

        // Connect to DB and fetch session
        await connectDB();
        const session = await SearchSession.findById(sessionId);
        
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            session: {
                sessionId: session._id.toString(),
                title: session.title,
                initialQuery: session.initialQuery,
                conversationHistory: session.conversationHistory,
                toolResults: session.toolResults, // Include tool results for candidate data
                attachedJd: session.attachedJd?.toString() || null, // Include attached JD ID
                attachedJdTitle: session.attachedJdTitle || null, // Include attached JD title
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            }
        });

    } catch (error: any) {
        console.error('Error fetching session:', error);
        return NextResponse.json({
            error: 'Failed to fetch session',
            details: error.message,
        }, { status: 500 });
    }
}

// Update conversation history
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        // Validate authentication token
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.API_AUTH_TOKEN;
        
        if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        const { sessionId } = await params;
        const { conversationHistory } = await request.json();

        if (!Array.isArray(conversationHistory)) {
            return NextResponse.json({ error: 'conversationHistory must be an array' }, { status: 400 });
        }

        // Connect to DB and update session
        await connectDB();
        const session = await SearchSession.findByIdAndUpdate(
            sessionId,
            { conversationHistory },
            { new: true }
        );
        
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Session updated successfully'
        });

    } catch (error: any) {
        console.error('Error updating session:', error);
        return NextResponse.json({
            error: 'Failed to update session',
            details: error.message,
        }, { status: 500 });
    }
}

// Delete conversation
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        // Validate authentication token
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.API_AUTH_TOKEN;
        
        if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        const { sessionId } = await params;

        // Connect to DB and delete session
        await connectDB();
        const session = await SearchSession.findByIdAndDelete(sessionId);
        
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        console.log(`Deleted session: ${sessionId}`);

        return NextResponse.json({
            success: true,
            message: 'Session deleted successfully'
        });

    } catch (error: any) {
        console.error('Error deleting session:', error);
        return NextResponse.json({
            error: 'Failed to delete session',
            details: error.message,
        }, { status: 500 });
    }
}

