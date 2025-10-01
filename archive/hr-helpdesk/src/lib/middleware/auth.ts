import { NextRequest } from 'next/server';
import { getUserById } from '@/lib/auth-helpers';

export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

/**
 * Simple API authentication middleware
 * For now, we'll use a simple API key approach
 * In production, consider JWT tokens or other robust methods
 */
export async function authenticateRequest(request: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    
    // For internal API calls, we'll check for a specific header or user ID
    const userId = request.headers.get('x-user-id');
    
    if (userId) {
      // Validate user exists in our database
      const user = await getUserById(userId);
      if (user) {
        return { success: true, user };
      }
    }
    
    // For now, we'll allow requests with a simple API key
    const internalApiKey = process.env.INTERNAL_API_KEY || 'internal-api-key-change-in-production';
    
    if (apiKey === internalApiKey) {
      return { success: true };
    }
    
    // If no valid authentication found
    return { 
      success: false, 
      error: 'Authentication required. Please provide valid credentials.' 
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      success: false, 
      error: 'Authentication failed' 
    };
  }
}

/**
 * Check if request is from authenticated user
 */
export async function requireAuth(request: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  const auth = await authenticateRequest(request);
  
  if (!auth.success) {
    return {
      success: false,
      error: auth.error || 'Authentication required'
    };
  }
  
  return auth;
}

/**
 * Express-style middleware for API authentication
 * Returns auth result with success flag and user data
 */
export async function authMiddleware(request: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  const auth = await authenticateRequest(request);
  
  return auth;
}