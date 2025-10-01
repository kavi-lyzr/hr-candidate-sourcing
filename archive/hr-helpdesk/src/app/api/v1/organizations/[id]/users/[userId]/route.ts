import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { User, OrganizationUser, Department, type IUser } from '@/lib/models';
import { getUserRoleInOrganization } from '@/lib/auth-helpers';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function validateRequest(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== INTERNAL_API_KEY) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { error: null };
}

// PUT /api/v1/organizations/{id}/users/{userId} - Update user role or department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const validation = await validateRequest(request);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const body = await request.json();
    const { role, department, currentUserId } = body;
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;
    const targetUserId = resolvedParams.userId;

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Current user ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if current user has permission to update users
    const currentUserRole = await getUserRoleInOrganization(currentUserId, organizationId);
    if (!currentUserRole || !['admin', 'manager'].includes(currentUserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find the target organization user
    const targetOrgUser = await OrganizationUser.findOne({
      _id: targetUserId,
      organizationId: organizationId
    });

    if (!targetOrgUser) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
    }

    // Get current user's MongoDB ID for comparison
    const currentUser = await User.findOne({ lyzrUserId: currentUserId });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Validate role change permissions
    if (role && role !== targetOrgUser.role) {
      const validRoles = ['employee', 'resolver', 'manager', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      // Managers cannot promote to admin or demote admins
      if (currentUserRole === 'manager') {
        if (role === 'admin') {
          return NextResponse.json({ error: 'Managers cannot add admin users' }, { status: 403 });
        }
        if (targetOrgUser.role === 'admin') {
          return NextResponse.json({ error: 'Managers cannot modify admin users' }, { status: 403 });
        }
      }

      // Users cannot modify their own role
      if (currentUser._id.toString() === targetOrgUser.userId?.toString()) {
        return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 403 });
      }

      // Check if user is trying to demote the last admin
      if (targetOrgUser.role === 'admin' && role !== 'admin') {
        const adminCount = await OrganizationUser.countDocuments({
          organizationId: organizationId,
          role: 'admin',
          status: 'active'
        });

        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot remove the last admin from the organization' },
            { status: 400 }
          );
        }
      }
    }

    // Validate department if provided
    if (department && department.trim()) {
      const departmentExists = await Department.findOne({
        _id: department,
        organizationId: organizationId
      });
      
      if (!departmentExists) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      }
    }

    // Update the user
    const updates: any = {};
    if (role) updates.role = role;
    if (department !== undefined) {
      updates.department = department.trim() || null;
    }

    const updatedOrgUser = await OrganizationUser.findByIdAndUpdate(
      targetUserId,
      updates,
      { new: true }
    )
    .populate<{ userId: IUser }>('userId', 'name email avatar')
    .populate<{ createdBy: IUser }>('createdBy', 'name email');

    if (!updatedOrgUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const responseUser = {
      _id: updatedOrgUser._id,
      email: updatedOrgUser.email,
      role: updatedOrgUser.role,
      status: updatedOrgUser.status,
      department: updatedOrgUser.department,
      user: updatedOrgUser.userId && typeof updatedOrgUser.userId === 'object' && '_id' in updatedOrgUser.userId ? {
        _id: updatedOrgUser.userId._id,
        name: updatedOrgUser.userId.name,
        email: updatedOrgUser.userId.email,
        avatar: updatedOrgUser.userId.avatar
      } : null,
      createdBy: updatedOrgUser.createdBy && typeof updatedOrgUser.createdBy === 'object' && '_id' in updatedOrgUser.createdBy ? {
        name: updatedOrgUser.createdBy.name,
        email: updatedOrgUser.createdBy.email
      } : null,
      invitedAt: updatedOrgUser.invitedAt,
      joinedAt: updatedOrgUser.joinedAt,
      createdAt: updatedOrgUser.createdAt,
      updatedAt: updatedOrgUser.updatedAt
    };

    return NextResponse.json({
      success: true,
      user: responseUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating organization user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/organizations/{id}/users/{userId} - Remove user from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const validation = await validateRequest(request);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('currentUserId');
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;
    const targetUserId = resolvedParams.userId;

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Current user ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if current user has permission to remove users
    const currentUserRole = await getUserRoleInOrganization(currentUserId, organizationId);
    if (!currentUserRole || !['admin', 'manager'].includes(currentUserRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find the target organization user
    const targetOrgUser = await OrganizationUser.findOne({
      _id: targetUserId,
      organizationId: organizationId
    });

    if (!targetOrgUser) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
    }

    // Managers cannot remove admins
    if (currentUserRole === 'manager' && targetOrgUser.role === 'admin') {
      return NextResponse.json({ error: 'Managers cannot remove admin users' }, { status: 403 });
    }

    // Get current user's MongoDB ID for comparison
    const currentUser = await User.findOne({ lyzrUserId: currentUserId });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Users cannot remove themselves
    if (currentUser._id.toString() === targetOrgUser.userId?.toString()) {
      return NextResponse.json({ error: 'Cannot remove yourself from the organization' }, { status: 403 });
    }

    // Check if this is the organization creator (prevent removing the last admin)
    const adminCount = await OrganizationUser.countDocuments({
      organizationId: organizationId,
      role: 'admin',
      status: 'active'
    });

    if (targetOrgUser.role === 'admin' && adminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last admin from the organization' },
        { status: 400 }
      );
    }

    // Remove the user from organization
    await OrganizationUser.findByIdAndDelete(targetUserId);

    return NextResponse.json({
      success: true,
      message: 'User removed from organization successfully'
    });

  } catch (error) {
    console.error('Error removing user from organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
