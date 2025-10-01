import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket, Department, OrganizationUser } from '@/lib/models';
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
    const { ticket_id, description, priority, department, status, user_token } = body;

    // Validate required fields
    if (!ticket_id) {
      return NextResponse.json(
        { error: 'Ticket ID is required. Try fetching the tickets first.' },
        { status: 400 }
      );
    }

    if (!user_token) {
      return NextResponse.json(
        { error: 'User token is required for editing tickets. Please provide a valid user token.' },
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

    // Find the ticket
    const ticket = await Ticket.findById(ticket_id);
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found. Try fetching the tickets first.' },
        { status: 404 }
      );
    }

    // Check if user has permission to edit this ticket
    if (userTokenValidation.userRole === 'employee') {
      // Employees can only edit their own tickets
      const organizationUser = await OrganizationUser.findById(userTokenValidation.organizationUserId);
      if (!organizationUser || !organizationUser.userId || 
          ticket.createdBy.toString() !== organizationUser.userId.toString()) {
        return NextResponse.json(
          { error: 'You can only edit your own tickets.' },
          { status: 403 }
        );
      }
    }
    // Other roles (resolver, manager, admin) can edit any ticket in the organization

    // Update only provided fields
    const updateFields: any = {};
    if (description !== undefined) {
      updateFields.description = description;
      // Update title if description changes
      const generateTitle = (desc: string) => {
        const words = desc.split(' ').slice(0, 8); // First 8 words
        const title = words.join(' ');
        return title.length > 50 ? title.substring(0, 47) + '...' : title;
      };
      updateFields.title = generateTitle(description);
    }
    if (priority !== undefined && ['low', 'medium', 'high', 'urgent'].includes(priority.toLowerCase())) {
      updateFields.priority = priority.toLowerCase();
    }
    if (status !== undefined) updateFields.status = status;
    
    // Handle department by finding the department by name
    if (department !== undefined) {
      let departmentId = null;
      if (department) {
        const foundDepartment = await Department.findOne({
          organizationId: context.organizationId,
          name: { $regex: new RegExp(`^${department}$`, 'i') } // Case-insensitive match
        });
        departmentId = foundDepartment?._id;
      }
      updateFields.department = departmentId;
    }

    // Update the ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticket_id,
      updateFields,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: {
        id: updatedTicket!._id,
        trackingNumber: updatedTicket!.trackingNumber,
        title: updatedTicket!.title,
        description: updatedTicket!.description,
        priority: updatedTicket!.priority,
        status: updatedTicket!.status,
        updatedAt: updatedTicket!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
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
