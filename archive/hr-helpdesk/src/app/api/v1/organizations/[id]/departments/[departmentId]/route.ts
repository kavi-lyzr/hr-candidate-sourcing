import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Department, OrganizationUser } from '@/lib/models';
import { getUserRoleInOrganization } from '@/lib/auth-helpers';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function validateRequest(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== INTERNAL_API_KEY) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { error: null };
}

// PUT /api/v1/organizations/{id}/departments/{departmentId} - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; departmentId: string }> }
) {
  try {
    const validation = await validateRequest(request);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const body = await request.json();
    const { name, description, userId } = body;
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;
    const departmentId = resolvedParams.departmentId;

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Department name and user ID are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user has permission to update departments
    const userRole = await getUserRoleInOrganization(userId, organizationId);
    if (!userRole || !['admin', 'manager'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find the department
    const department = await Department.findOne({
      _id: departmentId,
      organizationId: organizationId
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if new name conflicts with existing department (excluding current one)
    if (name.trim().toLowerCase() !== department.name.toLowerCase()) {
      const existingDepartment = await Department.findOne({
        organizationId: organizationId,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: departmentId }
      });

      if (existingDepartment) {
        return NextResponse.json(
          { error: 'Department with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update the department
    const updatedDepartment = await Department.findByIdAndUpdate(
      departmentId,
      {
        name: name.trim(),
        description: description?.trim() || undefined
      },
      { new: true }
    );

    if (!updatedDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Get user count
    const userCount = await OrganizationUser.countDocuments({
      organizationId: organizationId,
      department: departmentId,
      status: 'active'
    });

    return NextResponse.json({
      success: true,
      department: {
        _id: updatedDepartment._id,
        name: updatedDepartment.name,
        description: updatedDepartment.description,
        userCount,
        createdAt: updatedDepartment.createdAt,
        updatedAt: updatedDepartment.updatedAt
      },
      message: 'Department updated successfully'
    });

  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/organizations/{id}/departments/{departmentId} - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; departmentId: string }> }
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
    const departmentId = resolvedParams.departmentId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if user has permission to delete departments
    const userRole = await getUserRoleInOrganization(userId, organizationId);
    if (!userRole || !['admin', 'manager'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find the department
    const department = await Department.findOne({
      _id: departmentId,
      organizationId: organizationId
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if there are users assigned to this department
    const usersInDepartment = await OrganizationUser.countDocuments({
      organizationId: organizationId,
      department: departmentId,
      status: 'active'
    });

    if (usersInDepartment > 0) {
      return NextResponse.json(
        { error: `Cannot delete department. ${usersInDepartment} user(s) are still assigned to this department.` },
        { status: 400 }
      );
    }

    // Delete the department
    await Department.findByIdAndDelete(departmentId);

    // Clean up any remaining references (just in case)
    await OrganizationUser.updateMany(
      { department: departmentId },
      { $unset: { department: 1 } }
    );

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
