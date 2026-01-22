import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensurePhotographer } from '@/lib/auth-sync';
import { getPayloadClient } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

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

        const payload = await getPayloadClient();
        const project = await payload.findByID({
            collection: 'projects',
            id: projectId,
        });

        // Ensure project belongs to photographer
        // Payload relationship returns object or ID.
        // Assuming depth=0 or 1.
        // We will compare IDs.
        const projectOwnerId = typeof project.photographer === 'object' ? project.photographer.id : project.photographer;

        if (String(projectOwnerId) !== String(photographer.id)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const token = uuidv4().replace(/-/g, '').substring(0, 12);

        const shareLink = await payload.create({
            collection: 'share_links',
            data: {
                project: projectId,
                token: token,
                expires_at: expiresAt || null,
                download_limit: downloadLimit ? parseInt(downloadLimit) : null,
            }
        });

        return NextResponse.json(shareLink);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
