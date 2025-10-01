import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { User, OrganizationUser, Organization, type IUser } from '@/lib/models';
import { getUserRoleInOrganization } from '@/lib/auth-helpers';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function validateRequest(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== INTERNAL_API_KEY) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { error: null };
}

// GET /api/v1/organizations/{id}/users - Get users in organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateRequest(request);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if user has access to this organization and get their role
    const userRole = await getUserRoleInOrganization(userId, organizationId);
    if (!userRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // All users can access organization data, but with different scopes
    let users: any[] = [];
    
    if (['admin', 'manager', 'resolver'].includes(userRole)) {
      // Admins, managers, and resolvers can view all organization users
      const organizationUsers = await OrganizationUser.find({
        organizationId: organizationId
      })
      .populate<{ userId: IUser }>('userId', 'name email avatar')
      .populate<{ createdBy: IUser }>('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance

      // Format the response
      users = organizationUsers.map(orgUser => ({
        _id: orgUser._id,
        email: orgUser.email,
        role: orgUser.role,
        status: orgUser.status,
        department: orgUser.department,
        user: orgUser.userId && typeof orgUser.userId === 'object' && '_id' in orgUser.userId ? {
          _id: orgUser.userId._id,
          name: orgUser.userId.name,
          email: orgUser.userId.email,
          avatar: orgUser.userId.avatar
        } : null,
        createdBy: orgUser.createdBy && typeof orgUser.createdBy === 'object' && '_id' in orgUser.createdBy ? {
          name: orgUser.createdBy.name,
          email: orgUser.createdBy.email
        } : null,
        invitedAt: orgUser.invitedAt,
        joinedAt: orgUser.joinedAt,
        createdAt: orgUser.createdAt
      }));
    } else {
      // Employees get basic organization info without full user list
      // This allows them to access the endpoint for role and department info
      // but doesn't expose sensitive user data they shouldn't see
      users = [];
    }

    return NextResponse.json({
      success: true,
      users,
      userRole // Return the current user's role for frontend access control
    });

  } catch (error) {
    console.error('Error fetching organization users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/organizations/{id}/users - Add user to organization
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateRequest(request);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const body = await request.json();
    const { email, role, department, userId: currentUserId } = body;
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;

    if (!email || !role || !currentUserId) {
      return NextResponse.json(
        { error: 'Email, role, and current user ID are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['employee', 'resolver', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await dbConnect();

    // Get the current user's MongoDB ID first
    const currentUser = await User.findOne({ lyzrUserId: currentUserId });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Check if current user has permission to add users
    const currentUserRole = await getUserRoleInOrganization(currentUserId, organizationId);
    if (!currentUserRole || !['admin', 'manager'].includes(currentUserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Managers cannot add admins
    if (currentUserRole === 'manager' && role === 'admin') {
      return NextResponse.json({ error: 'Managers cannot add admin users' }, { status: 403 });
    }

    // Check if organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user already exists in this organization
    const existingOrgUser = await OrganizationUser.findOne({
      organizationId: organizationId,
      email: email.toLowerCase()
    });

    if (existingOrgUser) {
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 409 }
      );
    }

    // Check if user exists in our system
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    // Create organization user record
    const organizationUser = new OrganizationUser({
      organizationId: organizationId,
      email: email.toLowerCase(),
      role: role,
      status: existingUser ? 'active' : 'invited',
      userId: existingUser ? existingUser._id : null,
      createdBy: currentUser._id, // Use MongoDB ObjectId, not Lyzr user ID
      invitedAt: new Date(),
      joinedAt: existingUser ? new Date() : null,
      department: department || undefined
    });

    await organizationUser.save();

    // Populate the created record for response
    await organizationUser.populate<{ userId: IUser }>('userId', 'name email avatar');
    await organizationUser.populate<{ createdBy: IUser }>('createdBy', 'name email');

    const responseUser = {
      _id: organizationUser._id,
      email: organizationUser.email,
      role: organizationUser.role,
      status: organizationUser.status,
      department: organizationUser.department,
      user: organizationUser.userId && typeof organizationUser.userId === 'object' && '_id' in organizationUser.userId ? {
        _id: organizationUser.userId._id,
        name: organizationUser.userId.name,
        email: organizationUser.userId.email,
        avatar: organizationUser.userId.avatar
      } : null,
      createdBy: organizationUser.createdBy && typeof organizationUser.createdBy === 'object' && '_id' in organizationUser.createdBy ? {
        name: organizationUser.createdBy.name,
        email: organizationUser.createdBy.email
      } : null,
      invitedAt: organizationUser.invitedAt,
      joinedAt: organizationUser.joinedAt,
      createdAt: organizationUser.createdAt
    };

    return NextResponse.json({
      success: true,
      user: responseUser,
      message: existingUser 
        ? 'User added to organization successfully'
        : 'Invitation sent to user successfully'
    });

  } catch (error) {
    console.error('Error adding user to organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
