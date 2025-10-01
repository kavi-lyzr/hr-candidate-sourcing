import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Organization, OrganizationUser } from '@/lib/models';
import { chatWithLyzrAgent } from '@/lib/lyzr-services';
import { decrypt } from '@/lib/encryption';
import { getOrganizationDepartments } from '@/lib/organization-helpers';
import { getUserById } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    console.log('Chat API received body:', body);
    
    const { message, organizationId, userId, sessionId } = body;

    // Validate required fields
    if (!message || !organizationId || !userId) {
      console.error('Missing required fields:', { message: !!message, organizationId: !!organizationId, userId: !!userId });
      return NextResponse.json(
        { error: 'Message, organization ID, and user ID are required' },
        { status: 400 }
      );
    }

    // Get the organization and verify it has a Lyzr agent
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      console.error('Organization not found:', organizationId);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    console.log('Organization found:', { 
      name: organization.name, 
      hasAgent: !!organization.lyzrAgentId, 
      hasApiKey: !!organization.lyzrApiKey 
    });

    if (!organization.lyzrAgentId || !organization.lyzrApiKey) {
      console.error('AI assistant not configured:', { 
        agentId: organization.lyzrAgentId, 
        hasApiKey: !!organization.lyzrApiKey 
      });
      return NextResponse.json(
        { error: 'AI assistant not configured for this organization' },
        { status: 400 }
      );
    }

    // Get the user for context (supports both MongoDB ObjectId and Lyzr user ID)
    const user = await getUserById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User found:', { name: user.name, email: user.email, lyzrUserId: user.lyzrUserId });

    // Get the user's OrganizationUser record to get the user_token
    const organizationUser = await OrganizationUser.findOne({
      organizationId: organizationId,
      userId: user._id
    });

    if (!organizationUser) {
      console.error('User not found in organization:', { userId, organizationId });
      return NextResponse.json(
        { error: 'User not found in this organization' },
        { status: 404 }
      );
    }

    // Generate user_token from OrganizationUser._id
    const userToken = organizationUser._id.toString();
    console.log('Generated user token:', userToken);

    // Decrypt the API key
    const decryptedApiKey = decrypt(organization.lyzrApiKey);
    console.log('Decrypted API key length:', decryptedApiKey?.length || 0);

    // Get departments for the organization
    const departments = await getOrganizationDepartments(organizationId);
    const departmentsList = departments.length > 0 ? departments.join(', ') : 'HR, IT, Operations, Finance';

    // Format current date and time
    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Prepare system prompt variables
    const systemPromptVariables = {
      organization_name: organization.name,
      prompt: organization.systemInstruction || 'Provide helpful and professional HR assistance.',
      departments: departmentsList,
      datetime: formattedDateTime,
      user_details: `Name: ${user.name}, Email: ${user.email}, Role: ${organizationUser.role} requesting assistance`,
      user_token: userToken
    };

    // Chat with the Lyzr agent
    console.log('Calling Lyzr agent with:', {
      agentId: organization.lyzrAgentId,
      userEmail: user.email,
      message: message.substring(0, 50) + '...',
      hasSystemPromptVariables: Object.keys(systemPromptVariables).length > 0,
      sessionId
    });

    const chatResponse = await chatWithLyzrAgent(
      decryptedApiKey,
      organization.lyzrAgentId,
      message,
      user.email, // Use email as user_id for Lyzr
      systemPromptVariables,
      sessionId
    );

    console.log('Lyzr response received:', { 
      responseLength: chatResponse.response?.length || 0, 
      sessionId: chatResponse.session_id 
    });

    return NextResponse.json({
      success: true,
      response: chatResponse.response,
      sessionId: chatResponse.session_id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack?.substring(0, 500)
      });
      
      if (error.message.includes('Failed to chat with agent')) {
        return NextResponse.json(
          { error: 'AI assistant is temporarily unavailable', details: error.message },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process chat message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
