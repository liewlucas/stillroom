import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';
import { r2, R2_BUCKET } from '@/lib/r2';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { photoIds, projectId } = body;

        if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0 || !projectId) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const payload = await getPayloadClient();

        // 1. Verify Project Ownership
        const project = await payload.findByID({
            collection: 'projects',
            id: projectId,
        });

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const projectOwnerId = typeof project.photographer === 'object' ? project.photographer.id : project.photographer;
        const currentPhotographerResult = await payload.find({
            collection: 'photographers',
            where: { clerk_user_id: { equals: userId } }
        });

        if (currentPhotographerResult.docs.length === 0 || currentPhotographerResult.docs[0].id !== projectOwnerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 2. Fetch photos to get R2 keys
        // We actully need to find these specific photos to get their keys
        const photosToDelete = await payload.find({
            collection: 'photos',
            where: {
                and: [
                    { id: { in: photoIds } },
                    { project: { equals: projectId } } // Double check they belong to this project
                ]
            },
            limit: photoIds.length,
        });

        if (photosToDelete.docs.length === 0) {
            return NextResponse.json({ message: 'No photos found to delete' });
        }

        // 3. Delete from R2
        const r2Keys = photosToDelete.docs.map(p => ({ Key: p.r2_key }));

        if (r2Keys.length > 0) {
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: R2_BUCKET,
                Delete: {
                    Objects: r2Keys,
                    Quiet: true,
                },
            });
            await r2.send(deleteCommand);
        }

        // 4. Delete from Payload
        // Payload doesn't have a bulk delete by ID array easily exposed in local API as one shot?
        // standard delete operation usually takes an ID or a where query.
        // We can use delete providing a where clause.

        await payload.delete({
            collection: 'photos',
            where: {
                id: { in: photoIds }
            }
        });

        return NextResponse.json({ success: true, deletedCount: photosToDelete.docs.length });

    } catch (error) {
        console.error('[API/photos/bulk-delete] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
