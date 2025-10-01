import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// GET /api/organizations/{id}/departments - Client-safe wrapper for getting organization departments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Forward to internal API with proper authentication
    const response = await fetch(
      `${request.nextUrl.origin}/api/v1/organizations/${organizationId}/departments?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': INTERNAL_API_KEY!,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Error in organization departments wrapper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations/{id}/departments - Client-safe wrapper for creating organization department
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const organizationId = resolvedParams.id;

    // Forward to internal API with proper authentication
    const response = await fetch(
      `${request.nextUrl.origin}/api/v1/organizations/${organizationId}/departments`,
      {
        method: 'POST',
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
    console.error('Error in organization departments wrapper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
