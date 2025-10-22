import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import JobDescription from '@/models/jobDescription';
import User from '@/models/user';
import formidable from 'formidable';
import fs from 'fs/promises';
import { NextApiRequest } from 'next';

// Get user ID from the request using lyzrUserId query parameter
async function getUserIdFromRequest(req: Request): Promise<string | null> {
    const url = new URL(req.url);
    const lyzrUserId = url.searchParams.get('userId');

    if (!lyzrUserId) {
        return null;
    }

    const user = await User.findOne({ lyzrUserId });
    return user ? user._id.toString() : null;
}

export async function GET(request: Request) {
    await dbConnect();
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const jds = await JobDescription.find({ user: userId }).sort({ createdAt: -1 });
        return NextResponse.json(jds);
    } catch (error) {
        console.error('Error fetching JDs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    try {
        if (contentType.includes('application/json')) {
            const { title, content } = await request.json();
            if (!title || !content) {
                return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
            }
            const newJd = new JobDescription({ user: userId, title, content });
            await newJd.save();
            return NextResponse.json(newJd, { status: 201 });
        } else if (contentType.includes('multipart/form-data')) {
            const data = await request.formData();
            const file = data.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const title = file.name.replace(/\.[^/.]+$/, "");
            let content = '';

            if (file.type === 'application/pdf') {
                const pdf = (await import('pdf-parse')).default;
                const pdfData = await pdf(buffer);
                content = pdfData.text;
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const mammoth = (await import('mammoth')).default;
                const docxResult = await mammoth.extractRawText({ buffer });
                content = docxResult.value;
            } else if (file.type === 'text/plain') {
                content = buffer.toString('utf8');
            } else {
                return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
            }

            const newJd = new JobDescription({ user: userId, title, content });
            await newJd.save();
            return NextResponse.json(newJd, { status: 201 });
        } else {
            return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
        }
    } catch (error) {
        console.error('Error creating JD:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
