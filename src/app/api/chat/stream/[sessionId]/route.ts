import { NextRequest } from 'next/server';
import { pubsub } from '@/lib/pubsub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    // 1. Validate authentication token from query params
    const url = new URL(request.url);
    const token = decodeURIComponent(url.searchParams.get('token') || '');
    const expectedToken = process.env.API_AUTH_TOKEN;
    
    if (!token || !expectedToken || token !== expectedToken) {
        console.error(`[SSE] Token validation failed. Received: "${token?.substring(0, 10)}...", Expected: "${expectedToken?.substring(0, 10)}..."`);
        return new Response('Unauthorized - Invalid token', { status: 401 });
    }

    const { sessionId } = await params;
    console.log(`SSE connection established for session: ${sessionId}`);

    // 2. Create a ReadableStream for SSE
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`));

            // Subscribe to pubsub for this session
            const unsubscribe = pubsub.subscribe(sessionId, (data) => {
                try {
                    if (data.type === 'done') {
                        // Send done message and close
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        controller.close();
                        unsubscribe();
                    } else if (data.type === 'error') {
                        // Send error and close
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                        controller.close();
                        unsubscribe();
                    } else {
                        // Send data chunk
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                    }
                } catch (error) {
                    console.error('Error encoding SSE message:', error);
                    controller.error(error);
                    unsubscribe();
                }
            });

            // Set up cleanup on connection close
            request.signal.addEventListener('abort', () => {
                console.log(`SSE connection closed for session: ${sessionId}`);
                unsubscribe();
                try {
                    controller.close();
                } catch (e) {
                    // Controller might already be closed
                }
            });

            // Set timeout to close connection after 5 minutes if no activity
            const timeout = setTimeout(() => {
                console.log(`SSE connection timeout for session: ${sessionId}`);
                unsubscribe();
                try {
                    controller.close();
                } catch (e) {
                    // Controller might already be closed
                }
            }, 5 * 60 * 1000); // 5 minutes

            // Clear timeout if connection closes normally
            request.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
            });
        },
    });

    // 3. Return SSE response
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable buffering in nginx
        },
    });
}

