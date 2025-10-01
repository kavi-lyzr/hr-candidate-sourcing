import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket, OrganizationUser } from '@/lib/models';
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
    const { user_token } = body;

    // Validate user token
    if (!user_token) {
      return NextResponse.json(
        { error: 'User token is required for fetching tickets. Please provide a valid user token.' },
        { status: 400 }
      );
    }

    const userTokenValidation = await validateUserToken(user_token, context.organizationId);
    if (!userTokenValidation.success) {
      return NextResponse.json(
        { error: userTokenValidation.error },
        { status: 401 }
      );
    }

    // Build filter based on user role
    let filter: any = { organizationId: context.organizationId };

    // If user is an employee, only show their own tickets
    if (userTokenValidation.userRole === 'employee') {
      // Get the OrganizationUser to find the actual User ID
      const organizationUser = await OrganizationUser.findById(userTokenValidation.organizationUserId);
      if (organizationUser && organizationUser.userId) {
        filter.createdBy = organizationUser.userId;
      }
    }
    // Other roles (resolver, manager, admin) can see all organization tickets

    // Get tickets filtered by organization and user role
    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('createdBy', 'name email')
      .populate('organizationId', 'name')
      .populate('assignedTo', 'name email');

    const formattedTickets = tickets.map(ticket => ({
      id: ticket._id,
      trackingNumber: ticket.trackingNumber,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdBy: ticket.createdBy,
      organizationId: ticket.organizationId,
      assignedTo: ticket.assignedTo,
      tags: ticket.tags,
      dueDate: ticket.dueDate,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      message: 'Tickets retrieved successfully',
      tickets: formattedTickets,
      total: formattedTickets.length,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
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
