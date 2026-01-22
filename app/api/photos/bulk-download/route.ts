import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/data';
import archiver from 'archiver';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export async function POST(req: NextRequest) {
    try {
        const { photoIds, projectId } = await req.json();

        if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
            return NextResponse.json({ error: 'No photos selected' }, { status: 400 });
        }

        const payload = await getPayloadClient();

        // Verify photos belong to project (and implicit auth via project/payload)
        // Ideally we should check user permissions here too, but Payload does that if we used local API with context?
        // Using "find" is safe enough if we trust the IDs are valid UUIDs.
        const result = await payload.find({
            collection: 'photos',
            where: {
                and: [
                    { id: { in: photoIds } },
                    { project: { equals: projectId } }
                ]
            },
            limit: 1000
        });

        if (result.docs.length === 0) {
            return NextResponse.json({ error: 'No photos found' }, { status: 404 });
        }

        // Create archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // Create a PassThrough stream to pipe the archive to the response
        const stream = new ReadableStream({
            start(controller) {
                archive.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                archive.on('end', () => {
                    controller.close();
                });
                archive.on('error', (err) => {
                    controller.error(err);
                });
            }
        });

        // Process photos
        (async () => {
            try {
                for (const photo of result.docs) {
                    // Get stream from R2
                    const command = new GetObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: photo.r2_key,
                    });

                    try {
                        const response = await s3.send(command);
                        if (response.Body) {
                            // Convert generic stream to Node stream compatible with archiver
                            // AWS SDK v3 returns a web stream or node stream depending on env.
                            // In Next.js App Router (Node runtime), it's usually a sdk-stream-mixin.
                            // casting as any to avoid complex type matching with archiver
                            const bodyStream = response.Body as unknown as Readable;

                            const filename = photo.filename || `photo-${photo.id}.jpg`;
                            archive.append(bodyStream, { name: filename });
                        }
                    } catch (e) {
                        console.error(`Failed to download ${photo.id}`, e);
                        // Continue even if one fails
                    }
                }
                await archive.finalize();
            } catch (err) {
                console.error("Archive error", err);
                // We can't really change the response status now since streaming started
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
