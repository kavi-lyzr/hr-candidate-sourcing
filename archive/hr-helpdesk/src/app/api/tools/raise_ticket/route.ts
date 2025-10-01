import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket, User, Organization, Department, OrganizationUser } from '@/lib/models';
import { validateToolToken, validateUserToken } from '@/lib/middleware/tool-auth';

export async function POST(request: NextRequest) {
  try {
    // Validate tool token and extract context
    const tokenValidation = validateToolToken(request);
    if (!tokenValidation.success || !tokenValidation.context) {
      return NextResponse.json(
        { error: tokenValidation.error || 'Tool call not authorized' },
        { status: 401 }
      );
    }

    const { context } = tokenValidation;

    await dbConnect();

    const body = await request.json();
    const { description, priority, department, user_token } = body;

    // Validate required fields
    if (!description) {
      return NextResponse.json(
        { error: 'Description is required for creating a ticket' },
        { status: 400 }
      );
    }

    if (!user_token) {
      return NextResponse.json(
        { error: 'User token is required for creating a ticket. Please provide a valid user token.' },
        { status: 400 }
      );
    }

    // Validate user token
    const userTokenValidation = await validateUserToken(user_token, context.organizationId);
    if (!userTokenValidation.success) {
      return NextResponse.json(
        { error: userTokenValidation.error },
        { status: 401 }
      );
    }

    // Get the actual user from the user token (not the static context)
    const organizationUser = await OrganizationUser.findById(userTokenValidation.organizationUserId)
      .populate('userId')
      .populate('organizationId');

    if (!organizationUser || !organizationUser.userId || !organizationUser.organizationId) {
      return NextResponse.json(
        { error: 'User or organization not found' },
        { status: 404 }
      );
    }

    const user = organizationUser.userId;
    const organization = organizationUser.organizationId;

    // Smart department matching with fuzzy search
    let departmentId = null;
    if (department && department.trim()) {
      const deptName = department.trim();
      const orgId = typeof organization === 'object' && '_id' in organization 
        ? organization._id 
        : organization;
      
      // First try exact match (case-insensitive)
      let foundDepartment = await Department.findOne({
        organizationId: orgId,
        name: { $regex: new RegExp(`^${deptName}$`, 'i') }
      });
      
      // If no exact match, try fuzzy matching (contains)
      if (!foundDepartment) {
        foundDepartment = await Department.findOne({
          organizationId: orgId,
          name: { $regex: new RegExp(deptName, 'i') }
        });
      }
      
      // If still no match, try reverse fuzzy matching (department name contains input)
      if (!foundDepartment) {
        const allDepartments = await Department.find({
          organizationId: orgId
        });
        
        foundDepartment = allDepartments.find(dept => 
          dept.name.toLowerCase().includes(deptName.toLowerCase()) ||
          deptName.toLowerCase().includes(dept.name.toLowerCase())
        ) || null;
      }
      
      departmentId = foundDepartment?._id;
    }

    // Set smart defaults
    const ticketPriority = priority && ['low', 'medium', 'high', 'urgent'].includes(priority.toLowerCase()) 
      ? priority.toLowerCase() 
      : 'medium';
    
    // Generate a smart title from description
    const generateTitle = (desc: string) => {
      const words = desc.split(' ').slice(0, 8); // First 8 words
      const title = words.join(' ');
      return title.length > 50 ? title.substring(0, 47) + '...' : title;
    };

    // Create the ticket
    const userId = typeof user === 'object' && '_id' in user ? user._id.toString() : user.toString();
    const orgId = typeof organization === 'object' && '_id' in organization 
      ? organization._id.toString() 
      : organization.toString();
    
    const ticket = new Ticket({
      title: generateTitle(description),
      description,
      priority: ticketPriority,
      department: departmentId, // Store the department ObjectId reference (can be null)
      status: 'open',
      createdBy: userId,
      organizationId: orgId,
      assignedTo: [], // Will be assigned later
      tags: departmentId ? [] : [], // No automatic tags for now
    });

    await ticket.save();

    return NextResponse.json({
      success: true,
      message: 'Ticket created successfully',
      ticket: {
        id: ticket._id,
        trackingNumber: ticket.trackingNumber,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        department: departmentId ? 'Assigned' : 'Unassigned',
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
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
