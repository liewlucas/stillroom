import { getPayloadClient } from '@/lib/data';

export interface AlbumSummary {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    createdAt: string;
    coverPhotoId: string | null;
    photoCount: number;
}

export interface AlbumsForUser {
    photographer: {
        id: string | number;
        username: string;
        display_name?: string | null;
    } | null;
    albums: AlbumSummary[];
}

/**
 * Fetches the signed-in photographer's albums plus a cover photo id and photo
 * count for each. Covers/counts come from a single photos query (grouped in
 * JS) instead of one query per album — the sidebar renders this on every
 * dashboard page, so the old N+1 pattern would multiply quickly.
 */
export async function getAlbumsForUser(clerkUserId: string): Promise<AlbumsForUser> {
    const payload = await getPayloadClient();

    const photographers = await payload.find({
        collection: 'photographers',
        where: { clerk_user_id: { equals: clerkUserId } },
    });
    const photographer = photographers.docs[0];
    if (!photographer) {
        return { photographer: null, albums: [] };
    }

    const result = await payload.find({
        collection: 'galleries',
        where: { photographer: { equals: photographer.id } },
        sort: '-createdAt',
        pagination: false,
    });

    const coverByAlbum = new Map<string, string>();
    const countByAlbum = new Map<string, number>();

    if (result.docs.length > 0) {
        const photos = await payload.find({
            collection: 'photos',
            where: { project: { in: result.docs.map((g) => g.id) } },
            select: { project: true },
            depth: 0,
            sort: 'createdAt',
            pagination: false,
        });

        for (const photo of photos.docs) {
            const rel = photo.project;
            const albumId = String(
                typeof rel === 'object' && rel !== null
                    ? (rel as { id: string | number }).id
                    : rel
            );
            countByAlbum.set(albumId, (countByAlbum.get(albumId) ?? 0) + 1);
            if (!coverByAlbum.has(albumId)) {
                coverByAlbum.set(albumId, String(photo.id));
            }
        }
    }

    const albums: AlbumSummary[] = result.docs.map((g) => {
        const id = String(g.id);
        return {
            id,
            title: g.title as string,
            description: (g.description as string | null | undefined) ?? null,
            slug: g.slug as string,
            createdAt: g.createdAt as string,
            coverPhotoId: coverByAlbum.get(id) ?? null,
            photoCount: countByAlbum.get(id) ?? 0,
        };
    });

    return {
        photographer: {
            id: photographer.id,
            username: photographer.username as string,
            display_name: (photographer.display_name as string | null | undefined) ?? null,
        },
        albums,
    };
}
