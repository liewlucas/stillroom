import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { AlbumView } from '@/components/album-view';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
    const { albumId } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const payload = await getPayloadClient();

    // 1. Fetch album
    let album;
    try {
        album = await payload.findByID({ collection: 'galleries', id: albumId });
    } catch {
        notFound();
    }

    // 2. Authorization (ensure owner)
    const photographers = await payload.find({
        collection: 'photographers',
        where: { clerk_user_id: { equals: userId } }
    });

    const ownerId = typeof album.photographer === 'object' ? album.photographer.id : album.photographer;

    if (!photographers.docs || photographers.docs.length === 0 || photographers.docs[0].id !== ownerId) {
        return (
            <div className="w-full px-6 md:px-12 py-20 text-center">
                <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
                <p className="text-muted-foreground mt-2">You do not have permission to view this album.</p>
                <Link href="/dashboard/albums" className="mt-4 inline-block">
                    <Button variant="outline" className="rounded-full px-5">Back to albums</Button>
                </Link>
            </div>
        );
    }

    // 3. Fetch existing share links for this album
    const shareLinksResult = await payload.find({
        collection: 'share_links',
        where: { gallery: { equals: albumId } },
        sort: '-createdAt',
        limit: 20,
    });
    const shareLinks = shareLinksResult.docs.map((l) => ({
        id: String(l.id),
        token: l.token as string,
        slug: (l.slug as string | null) ?? null,
        expires_at: (l.expires_at as string | null) ?? null,
    }));

    // 4. Fetch photos (the photo→album relation is stored in the 'project' column)
    const result = await payload.find({
        collection: 'photos',
        where: { project: { equals: albumId } },
        limit: 100,
        sort: '-createdAt'
    });
    const photos = result.docs;

    return (
        <AlbumView
            album={{
                id: album.id,
                title: album.title as string,
                description: (album.description as string | null | undefined) ?? null,
                createdAt: album.createdAt as string,
            }}
            photos={photos}
            shareLinks={shareLinks}
            username={photographers.docs[0].username as string}
        />
    );
}
