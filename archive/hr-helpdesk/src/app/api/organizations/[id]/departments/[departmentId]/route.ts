import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// PUT /api/organizations/{id}/departments/{departmentId} - Client-safe wrapper for updating department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; departmentId: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;
    const departmentId = resolvedParams.departmentId;

    // Forward to internal API with proper authentication
    const response = await fetch(
      `${request.nextUrl.origin}/api/v1/organizations/${organizationId}/departments/${departmentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': INTERNAL_API_KEY!,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Error in department update wrapper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/{id}/departments/{departmentId} - Client-safe wrapper for deleting department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; departmentId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;
    const departmentId = resolvedParams.departmentId;

    // Forward to internal API with proper authentication
    const response = await fetch(
      `${request.nextUrl.origin}/api/v1/organizations/${organizationId}/departments/${departmentId}?userId=${userId}`,
      {
        method: 'DELETE',
        headers: {
          'x-api-key': INTERNAL_API_KEY!,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Error in department delete wrapper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
