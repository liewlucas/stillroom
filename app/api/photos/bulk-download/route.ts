import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/data';
import archiver from 'archiver';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { r2, R2_BUCKET } from '@/lib/r2';
import { authorizeGalleryOwner } from '@/lib/upload-auth';
import { getPhotoDownloadFilename, resolvePhotoKey } from '@/lib/photo-urls';

export const runtime = 'nodejs';
// Zipping a gallery of high-res originals runs well past the default ceiling.
// 60 is the Hobby plan cap; raise toward 300 only if this project is on Pro.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const { photoIds, projectId, token } = await req.json();

        if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
            return NextResponse.json({ error: 'No photos selected' }, { status: 400 });
        }

        const payload = await getPayloadClient();

        // Authorization: a share token issued for THIS gallery, or its owner.
        // Resolve the gallery id from whichever proof was presented rather than
        // from the request body — the body is attacker-controlled.
        let galleryId: string | number;

        if (token) {
            const shares = await payload.find({
                collection: 'share_links',
                where: { token: { equals: token } },
            });
            const share = shares.docs[0];
            if (!share) {
                return NextResponse.json({ error: 'Invalid share link' }, { status: 403 });
            }

            // Without this the token only proves "some share link exists", and any
            // link would download any gallery by swapping projectId in the body.
            const shareGalleryId = typeof share.gallery === 'object' ? share.gallery.id : share.gallery;
            if (String(shareGalleryId) !== String(projectId)) {
                return NextResponse.json({ error: 'Invalid share link' }, { status: 403 });
            }

            if (share.expires_at && new Date(share.expires_at) < new Date()) {
                return NextResponse.json({ error: 'Share link has expired' }, { status: 403 });
            }

            galleryId = shareGalleryId;
        } else {
            // Being signed in is not enough — confirm this user owns the gallery.
            const authorized = await authorizeGalleryOwner(String(projectId));
            if (!authorized.ok) {
                return NextResponse.json({ error: authorized.error }, { status: authorized.status });
            }
            galleryId = authorized.galleryId;
        }

        const result = await payload.find({
            collection: 'photos',
            where: {
                and: [
                    { id: { in: photoIds } },
                    { project: { equals: galleryId } },
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
                    // resolvePhotoKey falls back to the original so legacy
                    // galleries still download.
                    const resolved = resolvePhotoKey(photo, 'high');
                    if (!resolved) {
                        console.error(`[bulk-download] Skipping photo ${photo.id}: no R2 key`);
                        continue;
                    }
                    const { key } = resolved;

                    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
                    try {
                        const response = await r2.send(command);
                        if (response.Body) {
                            const bodyStream = response.Body as unknown as Readable;
                            archive.append(bodyStream, { name: getPhotoDownloadFilename(photo, key) });
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
                'Content-Disposition': `attachment; filename="photos-${galleryId}.zip"`,
            },
        });
    } catch (error) {
        console.error('Bulk download error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
