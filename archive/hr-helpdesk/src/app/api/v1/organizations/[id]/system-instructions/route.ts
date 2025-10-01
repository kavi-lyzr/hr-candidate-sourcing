import { NextRequest, NextResponse } from 'next/server';
import Organization from '@/lib/models/Organization';
import dbConnect from '@/lib/database';
import { getUserById } from '@/lib/auth-helpers';
import mongoose from 'mongoose';

// GET: Get system instructions for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization ID format' },
        { status: 400 }
      );
    }

    await dbConnect();

    const organization = await Organization.findById(organizationId).select('systemInstruction');
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      systemInstruction: organization.systemInstruction || ''
    });

  } catch (error) {
    console.error('Error fetching system instructions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system instructions' },
      { status: 500 }
    );
  }
}

// PUT: Update system instructions for an organization
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const { systemInstruction, userId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (typeof systemInstruction !== 'string') {
      return NextResponse.json(
        { success: false, error: 'System instruction must be a string' },
        { status: 400 }
      );
    }

    // Validate organizationId format (MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization ID format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get the user to ensure they exist (userId can be Clerk ID)
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify organization exists
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update system instruction
    organization.systemInstruction = systemInstruction;
    await organization.save();

    return NextResponse.json({
      success: true,
      message: 'System instructions updated successfully',
      systemInstruction: organization.systemInstruction
    });

  } catch (error) {
    console.error('Error updating system instructions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update system instructions' },
      { status: 500 }
    );
  }
}
