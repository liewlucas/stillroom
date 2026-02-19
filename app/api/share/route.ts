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

        const photographer = await ensurePhotographer(userId);
        const body = await req.json();
        const { galleryId, expiresAt, downloadLimit, customSlug } = body;

        if (!galleryId) {
            return NextResponse.json({ error: 'Gallery ID required' }, { status: 400 });
        }

        const payload = await getPayloadClient();
        const gallery = await payload.findByID({
            collection: 'galleries',
            id: galleryId,
        });

        const galleryOwnerId = typeof gallery.photographer === 'object' ? gallery.photographer.id : gallery.photographer;

        if (String(galleryOwnerId) !== String(photographer.id)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Validate custom slug if provided
        if (customSlug) {
            if (!/^[a-z0-9-]+$/.test(customSlug)) {
                return NextResponse.json({ error: 'Name can only contain lowercase letters, numbers, and hyphens' }, { status: 400 });
            }
            if (customSlug.length < 3 || customSlug.length > 50) {
                return NextResponse.json({ error: 'Name must be between 3 and 50 characters' }, { status: 400 });
            }
            const taken = await payload.find({ collection: 'share_links', where: { slug: { equals: customSlug } } });
            if (taken.docs.length > 0) {
                return NextResponse.json({ error: 'That URL name is already taken' }, { status: 409 });
            }
        }

        const token = uuidv4().replace(/-/g, '').substring(0, 12);

        const shareLink = await payload.create({
            collection: 'share_links',
            data: {
                gallery: gallery.id,
                token,
                slug: customSlug || null,
                expires_at: expiresAt || null,
                download_limit: downloadLimit ? parseInt(downloadLimit) : null,
            }
        });

        return NextResponse.json(shareLink);
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('[/api/share]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
