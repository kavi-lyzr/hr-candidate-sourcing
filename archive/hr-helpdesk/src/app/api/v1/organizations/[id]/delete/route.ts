import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import Organization from '@/lib/models/Organization';
import OrganizationUser from '@/lib/models/OrganizationUser';
import { getUserRoleInOrganization, getUserById } from '@/lib/auth-helpers';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function validateRequest(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== INTERNAL_API_KEY) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { error: null };
}

export async function DELETE(
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

    // Get the MongoDB user ID from the Lyzr user ID
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mongoUserId = user._id.toString();

    // Check if user is admin of this organization
    const userRole = await getUserRoleInOrganization(userId, organizationId);
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization admins can delete the organization' },
        { status: 403 }
      );
    }

    // Verify the organization exists and user is the creator
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (organization.createdBy.toString() !== mongoUserId) {
      return NextResponse.json(
        { error: 'Only the organization creator can delete the organization' },
        { status: 403 }
      );
    }

    // Delete all organization users first
    await OrganizationUser.deleteMany({ organizationId });

    // Delete the organization
    await Organization.findByIdAndDelete(organizationId);

    return NextResponse.json({
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
