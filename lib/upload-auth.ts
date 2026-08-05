import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';

/**
 * Payload's postgres adapter issues integer IDs, so a gallery id arrives as a
 * number over JSON. Normalize to string for use in R2 key prefixes.
 */
export function normalizeId(value: unknown): string | null {
    if (typeof value === 'string' && value.length > 0) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return null;
}

type AuthorizeResult =
    | { ok: true; photographerId: string | number; galleryId: string | number }
    | { ok: false; error: string; status: number };

/**
 * Confirms the signed-in Clerk user owns the photographer record that owns the
 * gallery. Both the presign and finalize routes call this — finalize cannot
 * trust that presign ran, since the client controls the request body.
 */
export async function authorizeGalleryUpload(projectId: string): Promise<AuthorizeResult> {
    const { userId } = await auth();
    if (!userId) {
        return { ok: false, error: 'Unauthorized', status: 401 };
    }

    const payload = await getPayloadClient();

    let gallery = null;
    try {
        gallery = await payload.findByID({
            collection: 'galleries',
            id: projectId,
        });
    } catch {
        gallery = null;
    }

    if (!gallery) {
        return { ok: false, error: 'Gallery not found', status: 404 };
    }

    const photographers = await payload.find({
        collection: 'photographers',
        where: { clerk_user_id: { equals: userId } },
    });

    const photographer = photographers.docs[0];
    const galleryOwnerId = typeof gallery.photographer === 'object'
        ? gallery.photographer.id
        : gallery.photographer;

    if (!photographer || photographer.id !== galleryOwnerId) {
        return { ok: false, error: 'Unauthorized', status: 403 };
    }

    return { ok: true, photographerId: photographer.id, galleryId: gallery.id };
}
