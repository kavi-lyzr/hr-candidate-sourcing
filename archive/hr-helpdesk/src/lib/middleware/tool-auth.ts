import { NextRequest } from 'next/server';
import { decrypt } from '@/lib/encryption';
import { ToolContext } from '@/lib/lyzr-services';
import { OrganizationUser } from '@/lib/models';
import dbConnect from '@/lib/database';

export interface ToolAuthResult {
  success: boolean;
  context?: ToolContext;
  error?: string;
}

export interface UserTokenResult {
  success: boolean;
  organizationUserId?: string;
  userRole?: string;
  error?: string;
}

/**
 * Extract and validate the x-token header from tool calls
 * Returns the decrypted context if valid, or error information if invalid
 */
export function validateToolToken(request: NextRequest): ToolAuthResult {
  try {
    // Extract x-token from headers
    const xToken = request.headers.get('x-token');
    
    if (!xToken) {
      return {
        success: false,
        error: 'Missing x-token header. Tool call not authorized.'
      };
    }

    // Decrypt the token
    const decryptedToken = decrypt(xToken);
    
    if (!decryptedToken || decryptedToken === xToken) {
      // If decryption failed or returned the same value, it's invalid
      return {
        success: false,
        error: 'Invalid x-token header. Tool call not authorized.'
      };
    }

    // Parse the context
    let context: ToolContext;
    try {
      context = JSON.parse(decryptedToken);
    } catch (parseError) {
      return {
        success: false,
        error: 'Malformed x-token header. Tool call not authorized.'
      };
    }

    // Validate required context fields
    if (!context.userId || !context.userEmail || !context.organizationId || !context.organizationName) {
      return {
        success: false,
        error: 'Incomplete context in x-token header. Tool call not authorized.'
      };
    }

    return {
      success: true,
      context
    };

  } catch (error) {
    console.error('Error validating tool token:', error);
    return {
      success: false,
      error: 'Failed to validate tool authorization.'
    };
  }
}

/**
 * Validate user_token parameter from tool calls
 * Returns the OrganizationUser ID and role if valid
 */
export async function validateUserToken(
  userToken: string, 
  organizationId: string
): Promise<UserTokenResult> {
  try {
    await dbConnect();

    // Validate MongoDB ObjectId format
    if (!userToken.match(/^[0-9a-fA-F]{24}$/)) {
      return {
        success: false,
        error: 'Invalid user token format. Please provide a valid user token.'
      };
    }

    // Find the OrganizationUser record
    const organizationUser = await OrganizationUser.findById(userToken)
      .populate('userId', 'name email')
      .lean();

    if (!organizationUser) {
      return {
        success: false,
        error: 'User token not found. Please provide a valid user token.'
      };
    }

    // Verify the user belongs to the correct organization
    if (organizationUser.organizationId.toString() !== organizationId) {
      return {
        success: false,
        error: 'User token does not belong to this organization. Access denied.'
      };
    }

    // Check if user is active
    if (organizationUser.status !== 'active') {
      return {
        success: false,
        error: 'User account is not active. Please contact your administrator.'
      };
    }

    return {
      success: true,
      organizationUserId: organizationUser._id.toString(),
      userRole: organizationUser.role
    };

  } catch (error) {
    console.error('Error validating user token:', error);
    return {
      success: false,
      error: 'Failed to validate user token. Please try again.'
    };
  }
}
