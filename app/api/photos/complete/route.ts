import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';

// Authoritative Spec: Flow 3 - Complete Upload
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { projectId, r2_key, width, height, file_size } = body;

        if (!projectId || !r2_key) {
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
        }

        const payload = await getPayloadClient();

        // 1. Verify Project Ownership (Strict)
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

        // 2. Save Metadata
        const photo = await payload.create({
            collection: 'photos',
            data: {
                project: projectId,
                r2_key,
                width: width || 0,
                height: height || 0,
                file_size: file_size || 0,
            }
        });

        return NextResponse.json(photo);

    } catch (error) {
        console.error('[API/photos/complete] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
