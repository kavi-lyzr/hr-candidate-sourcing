import { NextRequest, NextResponse } from 'next/server';
import KnowledgeBase from '@/lib/models/KnowledgeBase';
import Organization from '@/lib/models/Organization';
import dbConnect from '@/lib/database';
import { decrypt } from '@/lib/encryption';
import { getUserById } from '@/lib/auth-helpers';
import mongoose from 'mongoose';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// GET: Fetch all knowledge base documents for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');

    if (!organizationId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID and User ID are required' },
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

    // Fetch documents for the organization, excluding deleted ones
    const documents = await KnowledgeBase.find({
      organizationId: organizationId,
      status: { $ne: 'deleted' }
    })
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      documents: documents
    });

  } catch (error) {
    console.error('Error fetching knowledge base documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST: Upload and process a new document
export async function POST(request: NextRequest) {
  try {
    // Check if request has body
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { blobUrl, fileName, fileType, fileSize, organizationId, userId } = body;

    if (!blobUrl || !fileName || !fileType || !fileSize || !organizationId || !userId) {
      return NextResponse.json(
        { success: false, error: 'All fields (blobUrl, fileName, fileType, fileSize, organizationId, userId) are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { success: false, error: 'Only PDF, DOCX, and TXT files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (100MB)
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    // Fetch the file from Vercel Blob
    const fileResponse = await fetch(blobUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch uploaded file' },
        { status: 400 }
      );
    }

    const fileBlob = await fileResponse.blob();
    // Create a File object from the blob for compatibility with existing code
    const file = new File([fileBlob], fileName, { type: fileType });

    // Validate organizationId format (MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization ID format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get the user to ensure they exist and get their MongoDB _id (userId can be Clerk ID)
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get organization data for Lyzr API key and knowledge base ID
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!organization.lyzrApiKey || !organization.lyzrKnowledgeBaseId) {
      return NextResponse.json(
        { success: false, error: 'Organization Lyzr configuration not found. Please configure API key and knowledge base.' },
        { status: 400 }
      );
    }

    // Decrypt API key
    const apiKey = decrypt(organization.lyzrApiKey);

    // Determine file type and parser
    let fileTypeEnum: 'pdf' | 'docx' | 'txt';
    let dataParser: string;
    
    if (fileType === 'application/pdf') {
      fileTypeEnum = 'pdf';
      // dataParser = 'llmsherpa';
      dataParser = 'pypdf';
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileTypeEnum = 'docx';
      dataParser = 'docx2txt';
    } else {
      fileTypeEnum = 'txt';
      dataParser = 'txt_parser';
    }

    // Create initial document record in database with processing status
    const knowledgeDocument = new KnowledgeBase({
      title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
      fileName: fileName,
      originalFileName: fileName,
      fileType: fileTypeEnum,
      fileSize: fileSize,
      organizationId: organizationId,
      uploadedBy: user._id, // Use the MongoDB _id from the user record
      status: 'processing'
    });

    await knowledgeDocument.save();

    try {
      // Step 1: Parse document with Lyzr
      const parseFormData = new FormData();
      parseFormData.append('file', file);
      parseFormData.append('data_parser', dataParser);
      parseFormData.append('extra_info', '{}');

      // Add additional parameters for PDF parsing (following SvelteKit implementation)
      if (fileTypeEnum === 'pdf') {
        parseFormData.append('chunk_size', '1000');
        parseFormData.append('chunk_overlap', '100');
      }

      // Parse document based on type
      let parseUrl = '';
      if (fileTypeEnum === 'pdf') {
        parseUrl = 'https://rag-prod.studio.lyzr.ai/v3/parse/pdf/';
      } else if (fileTypeEnum === 'docx') {
        parseUrl = 'https://rag-prod.studio.lyzr.ai/v3/parse/docx/';
      } else {
        parseUrl = 'https://rag-prod.studio.lyzr.ai/v3/parse/txt/';
      }

      const parseResponse = await fetch(parseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey
        },
        body: parseFormData
      });

      if (!parseResponse.ok) {
        throw new Error(`PDF parsing failed: ${parseResponse.status} ${parseResponse.statusText}`);
      }

      const parseResult = await parseResponse.json();
      
      if (!parseResult.documents || !Array.isArray(parseResult.documents)) {
        throw new Error('Invalid response format from PDF parsing');
      }

      // Step 2: Train the knowledge base with parsed documents
      const trainResponse = await fetch(`https://rag-prod.studio.lyzr.ai/v3/rag/train/${organization.lyzrKnowledgeBaseId}/`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parseResult.documents)
      });

      if (!trainResponse.ok) {
        throw new Error(`Knowledge base training failed: ${trainResponse.status} ${trainResponse.statusText}`);
      }

      const trainResult = await trainResponse.json();

      // Update document status to active only after successful Lyzr processing
      await KnowledgeBase.findByIdAndUpdate(knowledgeDocument._id, {
        status: 'active',
        ragId: organization.lyzrKnowledgeBaseId,
        documentCount: parseResult.documents.length
      });

      console.log(`Document ${knowledgeDocument._id} processed successfully`);

      return NextResponse.json({
        success: true,
        message: 'Document uploaded and processed successfully',
        documentId: knowledgeDocument._id
      });

    } catch (lyzrError) {
      console.error('Lyzr processing error:', lyzrError);
      
      // Update document status to failed
      await KnowledgeBase.findByIdAndUpdate(knowledgeDocument._id, {
        status: 'failed',
        processingError: lyzrError instanceof Error ? lyzrError.message : 'Unknown error'
      });

      return NextResponse.json({
        success: false,
        error: `Document processing failed: ${lyzrError instanceof Error ? lyzrError.message : 'Unknown error'}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const organizationId = searchParams.get('organizationId');

    if (!documentId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Document ID and Organization ID are required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(documentId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the document
    const document = await KnowledgeBase.findOne({
      _id: documentId,
      organizationId: organizationId
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get organization for API key
    const organization = await Organization.findById(organizationId);
    if (!organization || !organization.lyzrApiKey || !organization.lyzrKnowledgeBaseId) {
      return NextResponse.json(
        { success: false, error: 'Organization configuration not found' },
        { status: 400 }
      );
    }

    // Decrypt API key
    const apiKey = decrypt(organization.lyzrApiKey);

    // Delete from Lyzr knowledge base if it has a ragId
    if (document.ragId) {
      try {
        const deleteResponse = await fetch(`https://rag-prod.studio.lyzr.ai/v3/rag/${organization.lyzrKnowledgeBaseId}/docs/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          body: JSON.stringify({
            source_names: [document.fileName]
          })
        });

        if (!deleteResponse.ok) {
          console.error('Failed to delete from Lyzr:', await deleteResponse.text());
        }
      } catch (error) {
        console.error('Error deleting from Lyzr:', error);
      }
    }

    // Mark document as deleted in database
    document.status = 'deleted';
    await document.save();

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// Document processing is now done synchronously in the POST method above
