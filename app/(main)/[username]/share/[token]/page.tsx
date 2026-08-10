import { getPayloadClient } from '@/lib/data';
import { notFound } from 'next/navigation';
import { PublicGalleryView } from '@/components/public-gallery-view';
import { HERO_SIGNED_URL_TTL_SECONDS, signPhotoUrl } from '@/lib/photo-urls';

export const runtime = 'nodejs';

export default async function SharedGalleryPage({
    params,
}: {
    params: Promise<{ username: string; token: string }>;
}) {
    const { username, token: name } = await params;
    const payload = await getPayloadClient();

    // Look up by slug first, then fall back to token
    let share = null;
    const bySlug = await payload.find({
        collection: 'share_links',
        where: { slug: { equals: name } },
    });
    if (bySlug.docs.length > 0) {
        share = bySlug.docs[0];
    } else {
        const byToken = await payload.find({
            collection: 'share_links',
            where: { token: { equals: name } },
        });
        if (byToken.docs.length > 0) share = byToken.docs[0];
    }

    if (!share) notFound();

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
                    <p className="text-muted-foreground">This album link is no longer available.</p>
                </div>
            </div>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gallery = typeof share.gallery === 'object' ? share.gallery : await payload.findByID({ collection: 'galleries', id: share.gallery as any });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photographer = typeof gallery.photographer === 'object' ? gallery.photographer : await payload.findByID({ collection: 'photographers', id: gallery.photographer as any });

    if (photographer.username !== username) notFound();

    const photos = await payload.find({
        collection: 'photos',
        where: { project: { equals: gallery.id } },
        limit: 200,
        sort: 'createdAt',
    });

    // The hero is the first photo in the album, signed here rather than fetched
    // after hydration — it is the largest element on the page, so an extra client
    // roundtrip before it can even start loading is the worst place to spend one.
    // Nothing is cached across requests, so a short-lived signature is safe.
    const heroPhoto = photos.docs[0];
    const heroSigned = heroPhoto
        ? await signPhotoUrl(heroPhoto, { variant: 'web', expiresIn: HERO_SIGNED_URL_TTL_SECONDS })
        : null;

    return (
        <PublicGalleryView
            gallery={gallery}
            photographer={photographer}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            photos={photos.docs as any[]}
            token={share.token as string}
            galleryId={String(gallery.id)}
            hero={heroSigned ? { url: heroSigned.url } : null}
        />
    );
}
