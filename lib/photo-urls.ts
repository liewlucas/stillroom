import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET } from '@/lib/r2';
import { getPhotoR2Key, type PhotoVariant } from '@/lib/photo-variants';

/** Short enough that a copied URL is worthless almost immediately. */
export const SIGNED_URL_TTL_SECONDS = 60;
/**
 * The hero is signed during SSR rather than fetched after hydration, so its URL
 * has to survive render + transfer + hydration on a slow phone connection.
 */
export const HERO_SIGNED_URL_TTL_SECONDS = 600;

export type PhotoRecord = {
    [key: string]: unknown;
    id?: unknown;
    original_filename?: unknown;
    r2_key?: string | null;
    web_r2_key?: string | null;
    high_res_r2_key?: string | null;
};

// Rows created before the variant pipeline existed only have an original. Falling
// back keeps legacy albums viewable and downloadable instead of 404-ing per photo.
const VARIANT_FALLBACKS: Record<PhotoVariant, PhotoVariant[]> = {
    web: ['web', 'high', 'full'],
    high: ['high', 'full'],
    full: ['full'],
};

const MIME_BY_EXTENSION: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
};

export function resolvePhotoKey(photo: PhotoRecord, requested: PhotoVariant = 'high') {
    for (const variant of VARIANT_FALLBACKS[requested]) {
        const key = getPhotoR2Key(photo, variant);
        if (typeof key === 'string' && key.length > 0) return { key, variant };
    }
    return null;
}

export function getPhotoContentType(key: string) {
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    return MIME_BY_EXTENSION[ext] ?? 'application/octet-stream';
}

/**
 * `<original name>.<ext>`, where the extension comes from the key actually being
 * served — the web and high-res variants are always JPEG even when the original
 * upload was a PNG, so trusting the original filename's extension would lie.
 */
export function getPhotoDownloadFilename(photo: PhotoRecord, key: string) {
    const fallback = `photo-${String(photo.id || 'download')}`;
    const original = typeof photo.original_filename === 'string' && photo.original_filename.trim()
        ? photo.original_filename.trim()
        : fallback;
    // Strip any path components a client may have sent at upload time.
    const leaf = original.split(/[\\/]/).pop() || fallback;
    const basename = leaf.replace(/\.[^.]+$/, '') || fallback;
    const ext = key.split('.').pop()?.toLowerCase() || 'jpg';
    return `${basename}.${ext}`;
}

/**
 * Content-Disposition carrying a filename that may contain non-ASCII characters.
 * The quoted form is the ASCII-safe fallback; `filename*` is what modern browsers
 * actually read (RFC 5987).
 */
function contentDisposition(type: 'attachment' | 'inline', filename: string) {
    const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/**
 * Presign a GET for one photo variant.
 *
 * With `disposition: 'attachment'` the signed URL itself instructs R2 to serve
 * the object as a named download. That matters because the browser `download`
 * attribute is ignored on cross-origin URLs — without this, tapping "save" on
 * Android or desktop just navigates to the image instead of downloading it.
 */
export async function signPhotoUrl(
    photo: PhotoRecord,
    {
        variant = 'high',
        disposition,
        expiresIn = SIGNED_URL_TTL_SECONDS,
    }: {
        variant?: PhotoVariant;
        disposition?: 'attachment';
        expiresIn?: number;
    } = {},
) {
    const resolved = resolvePhotoKey(photo, variant);
    if (!resolved) return null;

    const filename = getPhotoDownloadFilename(photo, resolved.key);
    const contentType = getPhotoContentType(resolved.key);

    const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: resolved.key,
        // Only set the response overrides on the download path. The viewing path
        // (grid, lightbox, hero) is signed plainly so nothing that renders today
        // can regress if R2 ever treats these params differently to S3.
        ...(disposition
            ? {
                ResponseContentDisposition: contentDisposition(disposition, filename),
                ResponseContentType: contentType,
            }
            : {}),
    });

    const url = await getSignedUrl(r2, command, { expiresIn });

    return { url, filename, contentType, variant: resolved.variant, key: resolved.key };
}
