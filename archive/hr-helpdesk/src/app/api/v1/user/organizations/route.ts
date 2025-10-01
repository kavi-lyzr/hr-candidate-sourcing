import { NextRequest, NextResponse } from 'next/server';
import { OrganizationUser, Organization } from '@/lib/models';
import dbConnect from '@/lib/database';
import { getUserById } from '@/lib/auth-helpers';
import { IOrganization } from '@/lib/models/Organization';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get the user to ensure we have their MongoDB _id
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const mongoUserId = user._id.toString();

    // Get all organizations where the user is a member (using MongoDB _id)
    const organizationUsers = await OrganizationUser.find({ 
      userId: mongoUserId 
    }).populate<{ organizationId: IOrganization }>('organizationId');

    // Get all organizations created by the user (using MongoDB _id)
    const createdOrganizations = await Organization.find({ 
      createdBy: mongoUserId 
    });

    // Create a set to track organization IDs we've already included
    const includedOrgIds = new Set<string>();
    const allOrganizations: any[] = [];

    // Add organizations from OrganizationUser table
    organizationUsers.forEach(ou => {
      if (ou.organizationId && !includedOrgIds.has(ou.organizationId._id.toString())) {
        includedOrgIds.add(ou.organizationId._id.toString());
        allOrganizations.push({
          _id: ou.organizationId._id,
          name: ou.organizationId.name,
          role: ou.role,
          joinedAt: ou.joinedAt || ou.createdAt,
          organization: ou.organizationId,
        });
      }
    });

    // Add created organizations (if not already included)
    createdOrganizations.forEach(org => {
      if (!includedOrgIds.has(org._id.toString())) {
        includedOrgIds.add(org._id.toString());
        allOrganizations.push({
          _id: org._id,
          name: org.name,
          role: 'admin' as const,
          joinedAt: org.createdAt,
          organization: org,
        });
      }
    });

    return NextResponse.json({
      success: true,
      organizations: allOrganizations,
    });
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}