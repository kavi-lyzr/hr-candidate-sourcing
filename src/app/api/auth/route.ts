import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { createOrUpdateUserAndAgents } from '@/lib/lyzr-services';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const { user: lyzrUser, lyzrApiKey } = await request.json();

        if (!lyzrUser || !lyzrUser.id || !lyzrUser.email || !lyzrApiKey) {
            return NextResponse.json({ error: 'Invalid user data or API key provided' }, { status: 400 });
        }

        const user = await createOrUpdateUserAndAgents(lyzrUser, lyzrApiKey);

        return NextResponse.json({ user });

    } catch (error: any) {
        console.error('Error in Lyzr auth callback:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
