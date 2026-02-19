import { getPayloadClient } from '@/lib/data';
import { notFound } from 'next/navigation';
import { PublicGalleryView } from '@/components/public-gallery-view';

export const runtime = 'nodejs';

export default async function SharedGalleryPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const payload = await getPayloadClient();

    // 1. Validate token
    const shares = await payload.find({
        collection: 'share_links',
        where: { token: { equals: token } },
    });

    if (!shares.docs || shares.docs.length === 0) {
        notFound();
    }
    const share = shares.docs[0];

    // 2. Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
                    <p className="text-muted-foreground">This gallery link is no longer available.</p>
                </div>
            </div>
        );
    }

    // 3. Resolve gallery
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gallery = typeof share.gallery === 'object' ? share.gallery : await payload.findByID({ collection: 'galleries', id: share.gallery as any });

    // 4. Resolve photographer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photographer = typeof gallery.photographer === 'object' ? gallery.photographer : await payload.findByID({ collection: 'photographers', id: gallery.photographer as any });

    // 5. Fetch photos
    const photos = await payload.find({
        collection: 'photos',
        where: { project: { equals: gallery.id } },
        limit: 200,
        sort: 'createdAt',
    });

    return (
        <PublicGalleryView
            gallery={gallery}
            photographer={photographer}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            photos={photos.docs as any[]}
            token={token}
        />
    );
}
