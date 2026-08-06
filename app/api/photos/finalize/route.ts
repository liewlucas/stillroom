import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/data';
import { r2, R2_BUCKET, MAX_UPLOAD_BYTES } from '@/lib/r2';
import { authorizeGalleryOwner, normalizeId } from '@/lib/upload-auth';
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

export const runtime = 'nodejs';
// Variant generation no longer shares its budget with the upload itself, but a
// large original still needs more than the default ceiling.
export const maxDuration = 60;

async function createJpegVariant(input: Buffer, maxSize: number, quality: number) {
    return sharp(input)
        .rotate()
        .resize({
            width: maxSize,
            height: maxSize,
            fit: 'inside',
            withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
}

async function cleanupR2Objects(keys: string[]) {
    if (keys.length === 0) return;

    try {
        await r2.send(new DeleteObjectsCommand({
            Bucket: R2_BUCKET,
            Delete: {
                Objects: keys.map((Key) => ({ Key })),
                Quiet: true,
            },
        }));
    } catch (error) {
        console.error('[API/photos/finalize] Failed to clean up R2 objects:', keys, error);
    }
}

/**
 * Runs after the browser has PUT the original directly to R2. Reads that object
 * back server-side (no request-body limit applies), derives the web and
 * high-res variants, and records the photo.
 */
export async function POST(req: NextRequest) {
    // Includes the original: if we fail here no DB row exists, so leaving it
    // behind would orphan it.
    const uploadedKeys: string[] = [];

    try {
        const body = await req.json();
        const { photoId, key, filename, contentType } = body ?? {};

        const projectId = normalizeId(body?.projectId);
        if (!projectId || typeof photoId !== 'string' || typeof key !== 'string') {
            return NextResponse.json({ error: 'Missing album, photo id, or key' }, { status: 400 });
        }

        const authorized = await authorizeGalleryOwner(projectId);
        if (!authorized.ok) {
            return NextResponse.json({ error: authorized.error }, { status: authorized.status });
        }

        // The client supplies the key, so pin it to the prefix this user is
        // allowed to write. Without this, any signed-in photographer could
        // attach someone else's object to their own gallery.
        const prefix = `photographers/${authorized.photographerId}/projects/${authorized.galleryId}/${photoId}`;
        const expectedKey = /^full\.(jpg|jpeg|png|webp)$/;
        if (!key.startsWith(`${prefix}/`) || !expectedKey.test(key.slice(prefix.length + 1))) {
            return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
        }

        const originalKey = key;
        const webKey = `${prefix}/web.jpg`;
        const highResKey = `${prefix}/high.jpg`;
        uploadedKeys.push(originalKey);

        let original;
        try {
            original = await r2.send(new GetObjectCommand({
                Bucket: R2_BUCKET,
                Key: originalKey,
            }));
        } catch {
            return NextResponse.json({ error: 'Uploaded file not found' }, { status: 404 });
        }

        if (!original.Body) {
            return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
        }

        // Trust R2's byte count over anything the client claimed.
        const actualSize = original.ContentLength ?? 0;
        if (actualSize > MAX_UPLOAD_BYTES) {
            await cleanupR2Objects(uploadedKeys);
            return NextResponse.json(
                { error: `Image exceeds the ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit` },
                { status: 413 },
            );
        }

        const originalBuffer = Buffer.from(await original.Body.transformToByteArray());
        const resolvedContentType = original.ContentType
            || (typeof contentType === 'string' ? contentType : null);

        let originalMetadata;
        try {
            originalMetadata = await sharp(originalBuffer).metadata();
        } catch {
            await cleanupR2Objects(uploadedKeys);
            return NextResponse.json({ error: 'File is not a readable image' }, { status: 400 });
        }

        // Sequential, not Promise.all: each sharp pipeline decodes the full
        // original into raw pixels, so running both at once doubles peak memory
        // and a large original will OOM the function.
        const webVariant = await createJpegVariant(originalBuffer, 1600, 75);
        const highResVariant = await createJpegVariant(originalBuffer, 3000, 88);

        const uploadResults = await Promise.allSettled([
            r2.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: webKey,
                Body: webVariant.data,
                ContentType: 'image/jpeg',
                ContentLength: webVariant.data.length,
            })).then(() => uploadedKeys.push(webKey)),
            r2.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: highResKey,
                Body: highResVariant.data,
                ContentType: 'image/jpeg',
                ContentLength: highResVariant.data.length,
            })).then(() => uploadedKeys.push(highResKey)),
        ]);

        const failedUpload = uploadResults.find((result) => result.status === 'rejected');
        if (failedUpload) {
            throw failedUpload.reason;
        }

        const payload = await getPayloadClient();

        const photo = await payload.create({
            collection: 'photos',
            data: {
                project: authorized.galleryId,
                r2_key: originalKey,
                web_r2_key: webKey,
                high_res_r2_key: highResKey,
                width: originalMetadata.width || 0,
                height: originalMetadata.height || 0,
                web_width: webVariant.info.width || 0,
                web_height: webVariant.info.height || 0,
                high_res_width: highResVariant.info.width || 0,
                high_res_height: highResVariant.info.height || 0,
                file_size: actualSize,
                web_file_size: webVariant.data.length,
                high_res_file_size: highResVariant.data.length,
                original_filename: typeof filename === 'string' ? filename : null,
                content_type: resolvedContentType,
            },
        });

        return NextResponse.json(photo);

    } catch (error) {
        await cleanupR2Objects(uploadedKeys);
        console.error('[API/photos/finalize] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
