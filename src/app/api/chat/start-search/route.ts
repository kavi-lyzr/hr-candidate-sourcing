import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/user';
import SearchSession from '@/models/searchSession';
import { decrypt, streamChatWithAgent } from '@/lib/lyzr-services';
import { availableLocations } from '@/lib/locations';
import { pubsub } from '@/lib/pubsub';

export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        // 1. Get authenticated user
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse request body
        const { query, jdId } = await request.json();
        
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 3. Connect to DB and fetch user
        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 4. Create a new search session
        const searchSession = new SearchSession({
            user: user._id,
            initialQuery: query,
            attachedJd: jdId || null,
            conversationHistory: [{
                role: 'user',
                content: query,
                timestamp: new Date(),
            }],
        });
        await searchSession.save();

        const sessionId = (searchSession._id as any).toString();
        console.log(`Created search session: ${sessionId}`);

        // 5. Prepare system prompt variables
        const systemPromptVariables = {
            user_name: user.displayName || user.email.split('@')[0],
            available_locations: Object.entries(availableLocations)
                .map(([name, code]) => `${name}: ${code}`)
                .join(', '),
            datetime: new Date().toISOString(),
        };

        // 6. Decrypt API key
        const apiKey = decrypt(user.lyzrApiKey);

        // 7. Start streaming chat in background (non-blocking)
        // We don't await this - let it run in background
        streamAndPublish(
            apiKey,
            user.sourcingAgent.agentId,
            query,
            user.lyzrUserId,
            systemPromptVariables,
            sessionId
        ).catch(error => {
            console.error(`Error in streaming for session ${sessionId}:`, error);
            pubsub.publish(sessionId, {
                type: 'error',
                error: error.message,
            });
        });

        // 8. Return session ID immediately
        return NextResponse.json({
            success: true,
            sessionId,
            message: 'Search initiated. Connect to stream endpoint for real-time updates.',
        });

    } catch (error: any) {
        console.error('Error in /api/chat/start-search:', error);
        return NextResponse.json({
            error: 'Failed to start search',
            details: error.message,
        }, { status: 500 });
    }
}

/**
 * Stream from agent and publish to pubsub
 */
async function streamAndPublish(
    apiKey: string,
    agentId: string,
    message: string,
    userId: string,
    systemPromptVariables: Record<string, any>,
    sessionId: string
) {
    try {
        const stream = await streamChatWithAgent(
            apiKey,
            agentId,
            message,
            userId,
            systemPromptVariables,
            sessionId
        );

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log(`Stream completed for session: ${sessionId}`);
                pubsub.publish(sessionId, { type: 'done' });
                break;
            }

            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Split by newlines to process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    
                    if (data === '[DONE]') {
                        console.log(`Received [DONE] for session: ${sessionId}`);
                        pubsub.publish(sessionId, { type: 'done' });
                        return;
                    }

                    // Publish the chunk to subscribers
                    pubsub.publish(sessionId, {
                        type: 'chunk',
                        data,
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in streamAndPublish:', error);
        throw error;
    }
}

