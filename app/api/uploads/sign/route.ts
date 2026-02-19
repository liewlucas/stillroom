import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';
import { r2, R2_BUCKET } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Authoritative Spec: Flow 2 - Get Upload URL
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { projectId, filename, contentType, size } = body;

        if (!projectId || !filename || !contentType) {
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
        }

        const payload = await getPayloadClient();

        // 1. Verify Project Ownership (Authoritative)
        const project = await payload.findByID({
            collection: 'galleries',
            id: projectId,
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Resolve Photographer ID of project
        const projectOwnerId = typeof project.photographer === 'object' ? project.photographer.id : project.photographer;

        // Find current photographer
        const currentPhotographerResult = await payload.find({
            collection: 'photographers',
            where: { clerk_user_id: { equals: userId } }
        });

        if (currentPhotographerResult.docs.length === 0 || currentPhotographerResult.docs[0].id !== projectOwnerId) {
            console.log('[API/uploads/sign] Ownership mismatch', userId, projectOwnerId);
            return NextResponse.json({ error: 'Unauthorized access to project' }, { status: 403 });
        }

        const photographer = currentPhotographerResult.docs[0];

        // 2. Generate Key
        const uniqueId = uuidv4();
        const ext = filename.split('.').pop();
        const key = `photographers/${photographer.id}/projects/${projectId}/${uniqueId}.${ext}`;

        // 3. Sign URL
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            ContentType: contentType,
            ContentLength: size,
        });

        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 600 });

        return NextResponse.json({
            uploadUrl: signedUrl,
            key: key
        });

    } catch (error) {
        console.error('[API/uploads/sign] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
