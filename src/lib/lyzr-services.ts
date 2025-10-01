import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';
import User, { IUser, IUserDocument } from '@/models/user';
import AgentVersion, { IAgentVersion, IAgentVersionDocument } from '@/models/agentVersion';
import ToolVersion, { IToolVersion, IToolVersionDocument } from '@/models/toolVersion';
import {
    LATEST_SOURCING_AGENT_VERSION,
    LATEST_MATCHING_AGENT_VERSION,
    LATEST_PROFILE_SUMMARY_AGENT_VERSION,
    LATEST_TOOL_VERSION,
    SOURCING_AGENT_CONFIG,
    MATCHING_AGENT_CONFIG,
    PROFILE_SUMMARY_AGENT_CONFIG,
    TOOL_CONFIG
} from './agent-config';

const LYZR_AGENT_BASE_URL = 'https://agent-prod.studio.lyzr.ai';

// --- Encryption --- (from archive)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-that-is-long-enough';

export function encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// --- Tool Management ---

async function createLyzrTool(apiKey: string, toolConfig: typeof TOOL_CONFIG, userId: string): Promise<string[]> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Update the tools schema with the correct server URL
    const updatedTools = {
        ...toolConfig.openapi_schema,
        info: {
            ...toolConfig.openapi_schema.info,
            title: `HR Sourcing & Matching API - ${userId}`,
        },
        servers: [
            {
                url: baseUrl,
                description: "HR Sourcing API Server"
            }
        ]
    };

    // Create encrypted context token for tool authorization
    const contextToken = encrypt(userId);

    const requestData = {
        tool_set_name: `${toolConfig.toolName}_v${LATEST_TOOL_VERSION}`,
        openapi_schema: updatedTools,
        default_headers: {
            "x-token": contextToken
        },
        default_query_params: {},
        default_body_params: {},
        endpoint_defaults: {},
        enhance_descriptions: false,
        openai_api_key: null
    };

    console.log('Creating Tool with request:', JSON.stringify(requestData, null, 2));

    const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/tools/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify(requestData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Tool creation failed:', response.status, errorText);
        throw new Error(`Failed to create tool: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Tool creation response:', data);
    
    // Extract just the tool names from the tool objects
    const toolNames = data.tool_ids ? data.tool_ids.map((tool: any) => tool.name) : [];
    console.log('Extracted tool names:', toolNames);
    
    return toolNames;
}

/**
 * Creates tools for a specific user. Tools are per-user since each has a unique x-token.
 * We no longer use ToolVersion collection because tools must be created per-user.
 */
async function createToolsForUser(apiKey: string, userId: string): Promise<string[]> {
    console.log(`Creating tools for user: ${userId}`);
    const toolIds = await createLyzrTool(apiKey, TOOL_CONFIG, userId);
    console.log(`Created ${toolIds.length} tools for user ${userId}`);
    return toolIds;
}

// --- Agent Management ---

/**
 * Filter tools based on agent type
 */
function filterToolsForAgent(allToolIds: string[], agentType: 'sourcing' | 'matching' | 'profile_summary'): string[] {
    if (agentType === 'sourcing') {
        return allToolIds.filter(toolId => toolId.includes('search_candidates'));
    } else if (agentType === 'matching') {
        return allToolIds.filter(toolId => toolId.includes('rank_candidates'));
    } else if (agentType === 'profile_summary') {
        return allToolIds.filter(toolId => toolId.includes('generate_profile_summaries'));
    }
    return [];
}

/**
 * Update tool_usage_description with actual tool names
 */
function updateToolUsageDescription(description: string, toolIds: string[], agentType: 'sourcing' | 'matching' | 'profile_summary'): string {
    let updated = description;
    
    if (agentType === 'sourcing') {
        const searchTool = toolIds.find(id => id.includes('search_candidates')) || toolIds[0];
        updated = updated.replace(/{{TOOL_SEARCH_CANDIDATES}}/g, searchTool || 'search_candidates');
    } else if (agentType === 'matching') {
        const rankTool = toolIds.find(id => id.includes('rank_candidates')) || toolIds[0];
        updated = updated.replace(/{{TOOL_RANK_CANDIDATES}}/g, rankTool || 'rank_candidates');
    } else if (agentType === 'profile_summary') {
        const summaryTool = toolIds.find(id => id.includes('generate_profile_summaries')) || toolIds[0];
        updated = updated.replace(/{{TOOL_GENERATE_SUMMARIES}}/g, summaryTool || 'generate_profile_summaries');
    }
    
    return updated;
}

async function createLyzrAgent(apiKey: string, agentConfig: any, allToolIds: string[]): Promise<string> {
    // Filter tools for this specific agent
    const agentToolIds = filterToolsForAgent(allToolIds, agentConfig.agentType);
    
    // Update tool_usage_description with actual tool names
    const updatedToolUsageDescription = updateToolUsageDescription(
        agentConfig.tool_usage_description,
        agentToolIds,
        agentConfig.agentType
    );

    // Remove agentType from payload (it's for internal use only)
    const { agentType, ...configWithoutInternal } = agentConfig;

    const payload = {
        ...configWithoutInternal,
        tools: agentToolIds,
        tool_usage_description: updatedToolUsageDescription,
        store_messages: true, // Enable message storage like helpdesk app
    };

    console.log(`Creating ${agentType} agent with tools:`, agentToolIds);

    const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/agents/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create Lyzr agent ${agentConfig.name}: ${error}`);
    }

    const data = await response.json();
    return data.agent_id;
}

async function updateLyzrAgent(apiKey: string, agentId: string, agentConfig: any, allToolIds: string[]): Promise<void> {
    // Filter tools for this specific agent
    const agentToolIds = filterToolsForAgent(allToolIds, agentConfig.agentType);
    
    // Update tool_usage_description with actual tool names
    const updatedToolUsageDescription = updateToolUsageDescription(
        agentConfig.tool_usage_description,
        agentToolIds,
        agentConfig.agentType
    );

    // Remove agentType from payload (it's for internal use only)
    const { agentType, ...configWithoutInternal } = agentConfig;

    const payload = {
        ...configWithoutInternal,
        tools: agentToolIds,
        tool_usage_description: updatedToolUsageDescription,
        store_messages: true, // Enable message storage like helpdesk app
    };

    console.log(`Updating ${agentType} agent with tools:`, agentToolIds);

    const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update Lyzr agent ${agentId}: ${error}`);
    }
}

// --- User and Agent Orchestration ---

// --- Chat Functions ---

/**
 * Stream chat with a Lyzr Agent
 */
/**
 * Chat with Lyzr Agent (Non-streaming)
 */
export async function chatWithLyzrAgent(
    apiKey: string,
    agentId: string,
    message: string,
    userEmail: string,
    systemPromptVariables: Record<string, any> = {},
    sessionId?: string
): Promise<{ response: string; session_id: string }> {
    const finalSessionId = sessionId || `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const requestBody = {
        user_id: userEmail,
        agent_id: agentId,
        session_id: finalSessionId,
        message: message,
        system_prompt_variables: systemPromptVariables,
        filter_variables: {},
        features: [],
        assets: []
    };

    console.log('Chat request (non-streaming):', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/inference/chat/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat failed:', response.status, errorText);
        throw new Error(`Failed to chat with agent: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Chat response:', data);
    
    return {
        response: data.response, // Note: using 'response' not 'agent_response'
        session_id: data.session_id || finalSessionId,
    };
}

/**
 * Stream chat with Lyzr Agent (Streaming - for future use)
 */
export async function streamChatWithAgent(
    apiKey: string,
    agentId: string,
    message: string,
    userId: string,
    systemPromptVariables: Record<string, any> = {},
    sessionId?: string
): Promise<ReadableStream> {
    const finalSessionId = sessionId || `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const requestBody = {
        user_id: userId,
        agent_id: agentId,
        session_id: finalSessionId,
        message: message,
        system_prompt_variables: systemPromptVariables,
        filter_variables: {},
        features: [],
    };

    console.log('Streaming chat request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/inference/stream/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming chat failed:', response.status, errorText);
        throw new Error(`Failed to stream chat with agent: ${response.status} ${errorText}`);
    }

    if (!response.body) {
        throw new Error('Response body is null');
    }

    return response.body;
}

// --- User and Agent Orchestration ---

export async function createOrUpdateUserAndAgents(lyzrUser: { id: string; email: string; name?: string; }, lyzrApiKey: string): Promise<IUserDocument> {
    const userIdentifier = { lyzrUserId: lyzrUser.id };
    const encryptedApiKey = encrypt(lyzrApiKey);

    // Find user first
    const user = await User.findOne(userIdentifier);

    if (user) {
        // --- EXISTING USER LOGIC ---
        console.log(`Updating existing user: ${user.email}`);
        user.lyzrApiKey = encryptedApiKey; // Always update the key

        // Ensure latest tool version exists
        const toolIds = await createToolsForUser(lyzrApiKey, lyzrUser.id);

        if (user.sourcingAgent.version !== LATEST_SOURCING_AGENT_VERSION) {
            console.log(`Updating sourcing agent for user ${user.email} from v${user.sourcingAgent.version} to v${LATEST_SOURCING_AGENT_VERSION}`);
            await updateLyzrAgent(lyzrApiKey, user.sourcingAgent.agentId, SOURCING_AGENT_CONFIG, toolIds);
            user.sourcingAgent.version = LATEST_SOURCING_AGENT_VERSION;
        }

        if (user.matchingAgent.version !== LATEST_MATCHING_AGENT_VERSION) {
            console.log(`Updating matching agent for user ${user.email} from v${user.matchingAgent.version} to v${LATEST_MATCHING_AGENT_VERSION}`);
            await updateLyzrAgent(lyzrApiKey, user.matchingAgent.agentId, MATCHING_AGENT_CONFIG, toolIds);
            user.matchingAgent.version = LATEST_MATCHING_AGENT_VERSION;
        }

        await user.save();
        return user;

    } else {
        // --- NEW USER LOGIC (with race condition handling) ---
        try {
            console.log(`Creating new user and agents for ${lyzrUser.email}`);
            
            // We must create tools before creating the agent
            const toolIds = await createToolsForUser(lyzrApiKey, lyzrUser.id);

            const sourcingAgentId = await createLyzrAgent(lyzrApiKey, SOURCING_AGENT_CONFIG, toolIds);
            const matchingAgentId = await createLyzrAgent(lyzrApiKey, MATCHING_AGENT_CONFIG, toolIds);

            const newUser = new User({
                ...userIdentifier,
                email: lyzrUser.email,
                displayName: lyzrUser.name || lyzrUser.email.split('@')[0],
                lyzrApiKey: encryptedApiKey,
                sourcingAgent: {
                    agentId: sourcingAgentId,
                    version: LATEST_SOURCING_AGENT_VERSION,
                },
                matchingAgent: {
                    agentId: matchingAgentId,
                    version: LATEST_MATCHING_AGENT_VERSION,
                },
            });

            await newUser.save();
            return newUser;

        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
                // Duplicate key error: another process created the user.
                console.log('Race condition detected on user creation, re-fetching user.');
                const existingUser = await User.findOne(userIdentifier);
                if (!existingUser) {
                    throw new Error('Failed to fetch user after user creation race condition.');
                }
                // We can either re-run the update logic or just return the user.
                // For simplicity, we'll return the user. The next login will handle agent updates if needed.
                return existingUser;
            } else {
                throw error; // Re-throw other errors
            }
        }
    }
}
