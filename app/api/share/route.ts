import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensurePhotographer } from '@/lib/auth-sync';
import { getAdminDirectus } from '@/lib/directus';
import { createItem, readItem } from '@directus/sdk';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const photographer = await ensurePhotographer();
        const body = await req.json();
        const { projectId, expiresAt, downloadLimit } = body;

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        // Verify ownership
        const client = getAdminDirectus();
        const project = await client.request(readItem('projects', projectId));

        if (project.photographer_id !== photographer.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const token = uuidv4().replace(/-/g, '').substring(0, 12); // Short random token

        const shareLink = await client.request(createItem('share_links', {
            project_id: projectId,
            token: token,
            expires_at: expiresAt || null,
            download_limit: downloadLimit ? parseInt(downloadLimit) : null,
        }));

        return NextResponse.json(shareLink);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
