import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';
import { r2, R2_BUCKET } from '@/lib/r2';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ galleryId: string }> }
) {
    try {
        const { userId } = await auth();
        const { galleryId } = await params;
        console.log(`[API/galleries/${galleryId}] DELETE request from ${userId}`);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await getPayloadClient();

        // 1. Verify Ownership
        const gallery = await payload.findByID({
            collection: 'galleries',
            id: galleryId,
        });

        if (!gallery) {
            return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
        }

        // Fetch photographer for the current user to verify ownership
        const photographers = await payload.find({
            collection: 'photographers',
            where: { clerk_user_id: { equals: userId } }
        });

        if (!photographers.docs.length) {
            return NextResponse.json({ error: 'Photographer not found' }, { status: 404 });
        }

        const currentPhotographerId = photographers.docs[0].id;
        const galleryOwnerId = typeof gallery.photographer === 'object'
            ? (gallery.photographer as any).id
            : gallery.photographer;

        if (galleryOwnerId !== currentPhotographerId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Cascade Delete Photos
        // Fetch all photos in the gallery
        const photos = await payload.find({
            collection: 'photos',
            where: { project: { equals: galleryId } },
            req,
            limit: 5000, // Reasonable limit, maybe need loop for massive galleries
        });

        if (photos.docs.length > 0) {
            const r2Keys = photos.docs.map(p => ({ Key: p.r2_key }));

            // Delete from R2
            try {
                // S3 deleteObjects can handle up to 1000 keys at once
                const chunkSize = 1000;
                for (let i = 0; i < r2Keys.length; i += chunkSize) {
                    const chunk = r2Keys.slice(i, i + chunkSize);
                    const deleteCommand = new DeleteObjectsCommand({
                        Bucket: R2_BUCKET,
                        Delete: {
                            Objects: chunk,
                            Quiet: true,
                        },
                    });
                    await r2.send(deleteCommand);
                }
                console.log(`[API/galleries/delete] Deleted ${r2Keys.length} photos from R2`);
            } catch (e) {
                console.error('[API/galleries/delete] Error deleting from R2:', e);
                // We typically continue to delete metadata even if R2 cleanup fails, 
                // or we could throw. Choosing to continue to ensure DB consistency.
            }

            // Delete from Payload
            // Using delete with 'where' clause for efficiency if supported, 
            // otherwise might need loop if 'delete' only takes ID.
            // Payload's delete operation can take a 'where' query.
            await payload.delete({
                collection: 'photos',
                where: { project: { equals: galleryId } },
            });
            console.log(`[API/galleries/delete] Deleted photo records from DB`);
        }

        // 3. Delete Gallery
        await payload.delete({
            collection: 'galleries',
            id: galleryId,
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[API/galleries/delete] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ galleryId: string }> }
) {
    try {
        const { userId } = await auth();
        const { galleryId } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description } = body;

        const payload = await getPayloadClient();

        // 1. Verify Ownership
        const gallery = await payload.findByID({
            collection: 'galleries',
            id: galleryId,
        });

        if (!gallery) {
            return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
        }

        // Fetch photographer for the current user to verify ownership
        const photographers = await payload.find({
            collection: 'photographers',
            where: { clerk_user_id: { equals: userId } }
        });

        if (!photographers.docs.length) {
            return NextResponse.json({ error: 'Photographer not found' }, { status: 404 });
        }

        const currentPhotographerId = photographers.docs[0].id;
        const galleryOwnerId = typeof gallery.photographer === 'object'
            ? (gallery.photographer as any).id
            : gallery.photographer;

        if (galleryOwnerId !== currentPhotographerId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Update Gallery
        const updatedGallery = await payload.update({
            collection: 'galleries',
            id: galleryId,
            data: {
                title: title !== undefined ? title : gallery.title,
                description: description !== undefined ? description : gallery.description,
            }
        });

        return NextResponse.json(updatedGallery);

    } catch (error) {
        console.error('[API/galleries/update] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
