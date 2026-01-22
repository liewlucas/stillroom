import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensurePhotographer } from '@/lib/auth-sync';
import { r2, R2_BUCKET } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { getPayloadClient } from '@/lib/data';

export const runtime = 'nodejs'; // Payload requires Node.js runtime, sadly breaks Edge goal unless adapter allows HTTP-only. 

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const photographer = await ensurePhotographer();

        const body = await req.json();
        const { projectId, filename, contentType, size, width, height } = body;

        if (!projectId || !filename || !contentType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate unique ID for the photo
        const photoId = uuidv4();
        const key = `photographers/${photographer.id}/projects/${projectId}/${photoId}.jpg`;

        // Generate Presigned URL
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            ContentType: contentType,
            ContentLength: size,
        });

        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 600 });

        const payload = await getPayloadClient();
        await payload.create({
            collection: 'photos',
            data: {
                project: projectId,
                r2_key: key,
                width: width || 0,
                height: height || 0,
                file_size: size,
            }
        });

        return NextResponse.json({
            uploadUrl: signedUrl,
            key: key,
            photoId: photoId
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
