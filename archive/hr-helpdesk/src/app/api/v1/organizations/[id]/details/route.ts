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

    // Get the MongoDB user ID from the Lyzr user ID
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mongoUserId = user._id.toString();

    // Get organization details
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this organization and get their role
    const userRole = await getUserRoleInOrganization(userId, organizationId);
    if (!userRole) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    // Get user's membership details
    const membership = await OrganizationUser.findOne({
      organizationId,
      userId: mongoUserId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator
    const isCreator = organization.createdBy.toString() === mongoUserId;

    return NextResponse.json({
      organization: {
        _id: organization._id,
        name: organization.name,
        avatar: organization.avatar,
        createdAt: organization.createdAt,
      },
      membership: {
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt,
      },
      isCreator,
    });
  } catch (error) {
    console.error('Error fetching organization details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
