import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          // Here you can implement additional authentication/authorization logic
          // For now, we'll allow uploads but could add user verification
          
          // Validate file types and sizes on the server side as well
          return {
            allowedContentTypes: [
              'application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain'
            ],
            allowOverwrite: true, // Allow overwriting files with the same name
            tokenPayload: JSON.stringify({
              // You can include additional metadata here if needed
              userId: clientPayload || 'unknown'
            }),
          };
        },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after successful upload
        console.log('Blob upload completed:', blob.url);
        
        // You can perform additional logging or validation here
        try {
          console.log('Token payload:', tokenPayload);
        } catch (error) {
          console.log('Failed to parse token payload:', error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload handling error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
