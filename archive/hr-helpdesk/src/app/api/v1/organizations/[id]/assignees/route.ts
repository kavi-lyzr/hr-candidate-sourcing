import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { OrganizationUser } from '@/lib/models';
import { getUserRoleInOrganization } from '@/lib/organization-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const { id: organizationId } = await params;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check user's access to organization
    const userRole = await getUserRoleInOrganization(organizationId, userId);
    if (!userRole) {
      return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
    }

    // Only managers and admins can see assignable users
    if (!['manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get users who can be assigned tickets (resolvers, managers, admins)
    const assignableUsers = await OrganizationUser.find({
      organizationId,
      role: { $in: ['resolver', 'manager', 'admin'] },
      status: 'active'
    })
      .populate('userId', 'name email avatar')
      .select('userId role');

    // Filter out users without userId (not yet joined) and ensure proper typing
    const activeAssignees = assignableUsers
      .filter(orgUser => orgUser.userId && typeof orgUser.userId === 'object' && 'name' in orgUser.userId)
      .map(orgUser => {
        const user = orgUser.userId as any; // We know it's a populated IUser at this point
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: orgUser.role
        };
      });

    return NextResponse.json({
      success: true,
      assignees: activeAssignees
    });
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    return NextResponse.json({ error: 'Failed to fetch assignable users' }, { status: 500 });
  }
}
