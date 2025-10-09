import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/user';
import SearchSession from '@/models/searchSession';
import JobDescription from '@/models/jobDescription';
import { decrypt, chatWithLyzrAgent } from '@/lib/lyzr-services';
import { availableLocations } from '@/lib/locations';

export const maxDuration = 180; // 3 minutes to allow for tool execution

export async function POST(request: Request) {
    try {
        // 1. Validate authentication token
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.API_AUTH_TOKEN;
        
        if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        // 2. Parse request body and validate user info
        const { query, jdId, user, sessionId } = await request.json();
        
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        if (!user || !user.id || !user.email) {
            return NextResponse.json({ error: 'User information is required' }, { status: 400 });
        }

        // 3. Connect to DB and fetch user
        await connectDB();
        const dbUser = await User.findOne({ lyzrUserId: user.id });
        
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        // 4. Fetch JD content if jdId is provided
        let jdContent = null;
        let jdTitle = null;
        if (jdId) {
            try {
                const jobDescription = await JobDescription.findById(jdId);
                if (jobDescription) {
                    jdContent = jobDescription.content;
                    jdTitle = jobDescription.title;
                    console.log(`Found JD: ${jdTitle} (${jdId})`);
                } else {
                    console.warn(`JD not found: ${jdId}`);
                }
            } catch (error) {
                console.error('Error fetching JD:', error);
            }
        }

        let searchSession;
        let finalSessionId = sessionId;

        // 5. Create new session or use existing one
        if (!sessionId) {
            // Create new session
            const title = query.slice(0, 50) + (query.length > 50 ? '...' : '');
            searchSession = new SearchSession({
                user: dbUser._id,
                title,
                initialQuery: query,
                attachedJd: jdId || null,
                attachedJdTitle: jdTitle || null,
                conversationHistory: [{
                    role: 'user',
                    content: query,
                    timestamp: new Date(),
                }],
            });
            await searchSession.save();
            finalSessionId = (searchSession._id as any).toString();
            console.log(`Created new search session: ${finalSessionId} for user: ${user.email}`);
        } else {
            // Update existing session
            searchSession = await SearchSession.findById(sessionId);
            if (!searchSession) {
                return NextResponse.json({ error: 'Session not found' }, { status: 404 });
            }
            
            // Add user message to history
            searchSession.conversationHistory.push({
                role: 'user',
                content: query,
                timestamp: new Date(),
            });
            await searchSession.save();
            console.log(`Updated search session: ${sessionId} for user: ${user.email}`);
        }

        // 6. Prepare enhanced query for new sessions with JD
        let enhancedQuery = query;
        if (!sessionId && jdContent && jdTitle) {
            // Only enhance query for new sessions with JD attached
            enhancedQuery = `Job Description:
Title: ${jdTitle}

${jdContent}

---

User Query: ${query}`;
            console.log(`Enhanced query with JD content for new session`);
        }

        // 7. Prepare system prompt variables
        const systemPromptVariables = {
            user_name: user.name || user.email.split('@')[0],
            session_id: finalSessionId, // Pass session ID to agent for tool calls
            available_locations: Object.entries(availableLocations)
                .map(([name, code]) => `${name}: ${code}`)
                .join(', '),
            datetime: new Date().toISOString(),
        };

        // 8. Decrypt API key and chat with agent
        const apiKey = decrypt(dbUser.lyzrApiKey);

        console.log('Calling Lyzr agent (non-streaming):', {
            agentId: dbUser.sourcingAgent.agentId,
            userEmail: user.email,
            message: enhancedQuery.substring(0, 50) + '...',
            sessionId: finalSessionId,
            hasJd: !!jdContent
        });

        const chatResponse = await chatWithLyzrAgent(
            apiKey,
            dbUser.sourcingAgent.agentId,
            enhancedQuery, // Use enhanced query instead of original
            user.email, // Use email as user_id for Lyzr
            systemPromptVariables,
            finalSessionId
        );

        console.log('Lyzr response received:', { 
            responseLength: chatResponse.response?.length || 0, 
            sessionId: chatResponse.session_id
        });

        // 9. Reload session from database to get tool results that were stored by the tool
        const updatedSession = await SearchSession.findById(finalSessionId);
        const allProfiles = updatedSession?.toolResults?.allProfiles || null;
        console.log('Tool results from database:', { 
            found: !!allProfiles,
            profileCount: allProfiles?.length || 0
        });

        // 10. Save assistant response to session
        searchSession.conversationHistory.push({
            role: 'assistant',
            content: chatResponse.response,
            timestamp: new Date(),
        });
        await searchSession.save();

        // 11. Return response with all profiles if available
        return NextResponse.json({
            success: true,
            response: chatResponse.response,
            sessionId: finalSessionId,
            all_profiles: allProfiles,
            message: 'Chat completed successfully',
        });

    } catch (error: any) {
        console.error('Error in /api/chat/send:', error);
        return NextResponse.json({
            error: 'Failed to process chat',
            details: error.message,
        }, { status: 500 });
    }
}

