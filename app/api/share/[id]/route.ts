import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';

export const runtime = 'nodejs';

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await getPayloadClient();

        // Fetch the share link
        const shareLink = await payload.findByID({ collection: 'share_links', id });

        // Resolve the gallery
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gallery = typeof shareLink.gallery === 'object' ? shareLink.gallery : await payload.findByID({ collection: 'galleries', id: shareLink.gallery as any });

        // Verify ownership
        const photographers = await payload.find({
            collection: 'photographers',
            where: { clerk_user_id: { equals: userId } },
        });

        const galleryOwnerId = typeof gallery.photographer === 'object' ? gallery.photographer.id : gallery.photographer;

        if (!photographers.docs.length || String(photographers.docs[0].id) !== String(galleryOwnerId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await payload.delete({ collection: 'share_links', id });

        return NextResponse.json({ success: true });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('[/api/share/[id] DELETE]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
