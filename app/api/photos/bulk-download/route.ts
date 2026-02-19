import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/data';
import archiver from 'archiver';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { r2, R2_BUCKET } from '@/lib/r2';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { photoIds, projectId, token } = await req.json();

        if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
            return NextResponse.json({ error: 'No photos selected' }, { status: 400 });
        }

        const payload = await getPayloadClient();

        // Authorization: valid share token OR authenticated owner
        if (token) {
            const shares = await payload.find({
                collection: 'share_links',
                where: { token: { equals: token } },
            });
            if (!shares.docs.length) {
                return NextResponse.json({ error: 'Invalid share link' }, { status: 403 });
            }
            const share = shares.docs[0];
            if (share.expires_at && new Date(share.expires_at) < new Date()) {
                return NextResponse.json({ error: 'Share link has expired' }, { status: 403 });
            }
        } else {
            const { userId } = await auth();
            if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await payload.find({
            collection: 'photos',
            where: {
                and: [
                    { id: { in: photoIds } },
                    { project: { equals: projectId } },
                ],
            },
            limit: 1000,
        });

        if (result.docs.length === 0) {
            return NextResponse.json({ error: 'No photos found' }, { status: 404 });
        }

        const archive = archiver('zip', { zlib: { level: 6 } });

        const stream = new ReadableStream({
            start(controller) {
                archive.on('data', (chunk) => controller.enqueue(chunk));
                archive.on('end', () => controller.close());
                archive.on('error', (err) => controller.error(err));
            },
        });

        (async () => {
            try {
                for (const photo of result.docs) {
                    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: photo.r2_key });
                    try {
                        const response = await r2.send(command);
                        if (response.Body) {
                            const bodyStream = response.Body as unknown as Readable;
                            const filename = photo.filename || `photo-${photo.id}.jpg`;
                            archive.append(bodyStream, { name: filename });
                        }
                    } catch (e) {
                        console.error(`Failed to fetch photo ${photo.id}`, e);
                    }
                }
                await archive.finalize();
            } catch (err) {
                console.error('Archive error', err);
            }
        })();

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="photos-${projectId}.zip"`,
            },
        });
    } catch (error) {
        console.error('Bulk download error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
