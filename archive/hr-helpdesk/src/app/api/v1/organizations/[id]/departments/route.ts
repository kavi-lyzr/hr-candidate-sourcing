import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Department, OrganizationUser, Organization } from '@/lib/models';
import { getUserRoleInOrganization } from '@/lib/auth-helpers';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function validateRequest(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== INTERNAL_API_KEY) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { error: null };
}

// GET /api/v1/organizations/{id}/departments - Get departments in organization
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

    // Check if user has access to this organization
    const userRole = await getUserRoleInOrganization(userId, organizationId);
    if (!userRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // All roles can view departments
    const departments = await Department.find({
      organizationId: organizationId
    }).sort({ name: 1 });

    // Get user counts for all departments in a single aggregation query
    const userCounts = await OrganizationUser.aggregate([
      {
        $match: {
          organizationId: organizationId,
          status: 'active',
          department: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$department',
          userCount: { $sum: 1 }
        }
      }
    ]);

    // Create a map for quick lookup
    const userCountMap = new Map(
      userCounts.map(item => [item._id.toString(), item.userCount])
    );

    // Format departments with user counts
    const departmentsWithCounts = departments.map(dept => ({
      _id: dept._id,
      name: dept.name,
      description: dept.description,
      userCount: userCountMap.get(dept._id.toString()) || 0,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt
    }));

    return NextResponse.json({
      success: true,
      departments: departmentsWithCounts,
      userRole
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/organizations/{id}/departments - Create new department
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
    const { name, description, userId } = body;
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Department name and user ID are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user has permission to create departments
    const userRole = await getUserRoleInOrganization(userId, organizationId);
    if (!userRole || !['admin', 'manager'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if department name already exists in this organization
    const existingDepartment = await Department.findOne({
      organizationId: organizationId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 409 }
      );
    }

    // Create the department
    const department = new Department({
      name: name.trim(),
      description: description?.trim() || undefined,
      organizationId: organizationId
    });

    await department.save();

    return NextResponse.json({
      success: true,
      department: {
        _id: department._id,
        name: department.name,
        description: department.description,
        userCount: 0,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt
      },
      message: 'Department created successfully'
    });

  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
