import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/data';
import archiver from 'archiver';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { r2, R2_BUCKET } from '@/lib/r2';
import { auth } from '@clerk/nextjs/server';
import { getPhotoR2Key } from '@/lib/photo-variants';

export const runtime = 'nodejs';
// Zipping a gallery of high-res originals runs well past the default ceiling.
// 60 is the Hobby plan cap; raise toward 300 only if this project is on Pro.
export const maxDuration = 60;

function getDownloadFilename(photo: { id?: unknown; original_filename?: unknown }, key: string) {
    const fallback = `photo-${String(photo.id || 'download')}`;
    const originalFilename = typeof photo.original_filename === 'string' && photo.original_filename.trim()
        ? photo.original_filename
        : fallback;
    const basename = originalFilename.replace(/\.[^/.]+$/, '') || fallback;
    // Take the extension from the key actually being streamed — the high-res
    // variant is always JPEG, but a legacy fallback to the original may not be.
    const ext = key.split('.').pop()?.toLowerCase() || 'jpg';
    return `${basename}.${ext}`;
}

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
                    // Rows created before variant generation have no high-res key;
                    // fall back to the original so legacy galleries still download.
                    const key = getPhotoR2Key(photo, 'high') || getPhotoR2Key(photo, 'full');
                    if (!key) {
                        console.error(`[bulk-download] Skipping photo ${photo.id}: no R2 key`);
                        continue;
                    }

                    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
                    try {
                        const response = await r2.send(command);
                        if (response.Body) {
                            const bodyStream = response.Body as unknown as Readable;
                            archive.append(bodyStream, { name: getDownloadFilename(photo, key) });
                        }
                    } catch (e) {
                        console.error(`Failed to fetch photo ${photo.id}`, e);
                    }
                }
            } catch (err) {
                console.error('Archive error', err);
            } finally {
                // The 200 and zip headers are already sent by this point, so the
                // archive MUST be closed on every path — bailing out early would
                // leave the client with a truncated, unopenable zip.
                try {
                    await archive.finalize();
                } catch (err) {
                    console.error('Archive finalize failed', err);
                }
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
