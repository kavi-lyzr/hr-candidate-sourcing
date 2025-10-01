import { NextRequest, NextResponse } from 'next/server';
import { createOrganization } from '@/lib/organization-helpers';
import { getUserById } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, createdBy, systemInstruction } = body;

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: 'Organization name and creator are required' },
        { status: 400 }
      );
    }

    // Validate that the creator exists and get their MongoDB _id
    const user = await getUserById(createdBy);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid creator' },
        { status: 400 }
      );
    }

    // Create the organization using the user's MongoDB _id
    const organization = await createOrganization({
      name: name.trim(),
      createdBy: user._id.toString(), // Use MongoDB _id instead of Lyzr user ID
      systemInstruction,
    });

    return NextResponse.json({
      success: true,
      organization: {
        _id: organization._id,
        name: organization.name,
        systemInstruction: organization.systemInstruction,
        createdBy: organization.createdBy,
        createdAt: organization.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    
    // Handle duplicate organization name
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Organization name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
