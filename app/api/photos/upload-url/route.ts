import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET, MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_TYPES } from '@/lib/r2';
import { authorizeGalleryOwner, normalizeId } from '@/lib/upload-auth';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

function getSourceExtension(filename: string, contentType: string) {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension && ['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
        return extension;
    }

    if (contentType === 'image/png') return 'png';
    if (contentType === 'image/webp') return 'webp';
    return 'jpg';
}

/**
 * Mints a short-lived presigned PUT so the browser can send the original
 * straight to R2. Vercel caps function request bodies at 4.5MB, so file bytes
 * must never pass through a route handler.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { filename, contentType, fileSize } = body ?? {};

        const projectId = normalizeId(body?.projectId);
        if (!projectId || typeof filename !== 'string') {
            return NextResponse.json({ error: 'Missing gallery or filename' }, { status: 400 });
        }

        if (typeof contentType !== 'string' || !ALLOWED_UPLOAD_TYPES.includes(contentType)) {
            return NextResponse.json(
                { error: 'File must be a JPEG, PNG, or WebP image' },
                { status: 400 },
            );
        }

        if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0) {
            return NextResponse.json({ error: 'Missing file size' }, { status: 400 });
        }

        if (fileSize > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: `Image exceeds the ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit` },
                { status: 413 },
            );
        }

        const authorized = await authorizeGalleryOwner(projectId);
        if (!authorized.ok) {
            return NextResponse.json({ error: authorized.error }, { status: authorized.status });
        }

        const photoId = uuidv4();
        const sourceExt = getSourceExtension(filename, contentType);
        // Build the prefix from the resolved DB ids, never the raw client string:
        // finalize recomputes this same prefix to validate the key, and the two
        // must agree byte-for-byte.
        const prefix = `photographers/${authorized.photographerId}/projects/${authorized.galleryId}/${photoId}`;
        const key = `${prefix}/full.${sourceExt}`;

        // ContentType is part of the signature, so the browser PUT must send a
        // matching header or R2 rejects it.
        const uploadUrl = await getSignedUrl(
            r2,
            new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                ContentType: contentType,
            }),
            // A 50MB original on a weak connection can take a while; the URL is
            // scoped to one key this user already owns, so a wider window is cheap.
            { expiresIn: 1800 },
        );

        return NextResponse.json({ uploadUrl, key, photoId });

    } catch (error) {
        console.error('[API/photos/upload-url] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
