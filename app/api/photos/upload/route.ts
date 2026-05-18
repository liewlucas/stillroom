import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';
import { r2, R2_BUCKET } from '@/lib/r2';
import { DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
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
        console.error('[API/photos/upload] Failed to clean up R2 objects:', keys, error);
    }
}

export async function POST(req: NextRequest) {
    const uploadedKeys: string[] = [];

    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const projectId = formData.get('projectId');
        const file = formData.get('file');

        if (typeof projectId !== 'string' || !(file instanceof File)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        const payload = await getPayloadClient();

        const gallery = await payload.findByID({
            collection: 'galleries',
            id: projectId,
        });

        if (!gallery) {
            return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const originalBuffer = Buffer.from(await file.arrayBuffer());
        const originalMetadata = await sharp(originalBuffer).metadata();
        const photoId = uuidv4();
        const sourceExt = getSourceExtension(file.name, file.type);
        const prefix = `photographers/${photographer.id}/projects/${projectId}/${photoId}`;
        const originalKey = `${prefix}/full.${sourceExt}`;
        const webKey = `${prefix}/web.jpg`;
        const highResKey = `${prefix}/high.jpg`;

        const [webVariant, highResVariant] = await Promise.all([
            createJpegVariant(originalBuffer, 1600, 75),
            createJpegVariant(originalBuffer, 3000, 88),
        ]);

        const uploadResults = await Promise.allSettled([
            r2.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: originalKey,
                Body: originalBuffer,
                ContentType: file.type || 'application/octet-stream',
                ContentLength: file.size,
            })).then(() => uploadedKeys.push(originalKey)),
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

        const photo = await payload.create({
            collection: 'photos',
            data: {
                project: gallery.id,
                r2_key: originalKey,
                web_r2_key: webKey,
                high_res_r2_key: highResKey,
                width: originalMetadata.width || 0,
                height: originalMetadata.height || 0,
                web_width: webVariant.info.width || 0,
                web_height: webVariant.info.height || 0,
                high_res_width: highResVariant.info.width || 0,
                high_res_height: highResVariant.info.height || 0,
                file_size: file.size,
                web_file_size: webVariant.data.length,
                high_res_file_size: highResVariant.data.length,
                original_filename: file.name,
                content_type: file.type || null,
            },
        });

        return NextResponse.json(photo);

    } catch (error) {
        await cleanupR2Objects(uploadedKeys);
        console.error('[API/photos/upload] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
