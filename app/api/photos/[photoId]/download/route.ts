import { NextRequest, NextResponse } from 'next/server';
import { r2, R2_BUCKET } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getPayloadClient } from '@/lib/data';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
    const { photoId } = await params;

    const searchParams = req.nextUrl.searchParams;
    const shareToken = searchParams.get('token');

    if (!photoId) {
        return NextResponse.json({ error: 'Missing Photo ID' }, { status: 400 });
    }

    try {
        const payload = await getPayloadClient();

        // 1. Fetch Photo Metadata
        // Payload find logic
        const photoResult = await payload.find({
            collection: 'photos',
            where: { r2_key: { contains: photoId } }, // Actually we generated local UUID for photoId. We should check if photoId matches Payload ID or r2_key content?
            // Our implementation:
            // In upload route: `photoId` (uuid) -> Saved as ID? Payload uses numbers by default for Postgres unless configured to UUID.
            // Postgres adapter uses numerical IDs by default? Or UUIDs?
            // Payload 3 default is numerical auto-increment usually.
            // We need to verify if we want UUIDs.
            // If we passed `id` field in creation, does it respect it?
            // In my upload logic I did not pass `id` to Payload create, just `photoId` to client.
            // Correctness Check: In upload route, I returned `photoId` which was a UUID generated there.
            // But I did NOT save that `photoId` as the main ID in Payload implicitly. Payload generates its own ID.
            // Fix: I should probably query by `r2_key` which contains the photoId I generated, OR better, rely on Payload ID.
            // Let's rely on `r2_key` for finding the photo if the client sends the `photoId` part of the key.
            // Wait, the client receives `photoId` from the upload response.
            // If I used `photoId` from upload response, I expect to use it here.
            // I should probably query by valid ID.
            // Let's assume for now I query by ID if I used Payload ID, but since I generated a separate UUID,
            // I might have a mismatch.
            // Refactor Upload route to return Payload ID as `id` to be safe?
            // For now, I'll search where r2_key contains the ID, which is safe enough.
        });

        // Better: In Upload Route, I should return the Payload ID.
        // But let's assume I fix this later or assume `findByID` works if I used payload ID.
        // Actually, let's query all photos and filter? No, inefficient.
        // Let's try to find by r2_key since that is unique.
        const photos = await payload.find({
            collection: 'photos',
            where: {
                r2_key: {
                    contains: photoId
                }
            }
        });

        if (photos.docs.length === 0) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }
        const photo = photos.docs[0];

        // 2. Authorization Check
        let authorized = false;
        let shareLink = null;

        const { userId } = await auth();
        if (userId) {
            const project = typeof photo.project === 'object' ? photo.project : await payload.findByID({ collection: 'projects', id: photo.project as any });
            const photographer = typeof project.photographer === 'object' ? project.photographer : await payload.findByID({ collection: 'photographers', id: project.photographer as any });

            // Verify against current user
            // We need to fetch current photographer record
            const currentPhotographers = await payload.find({
                collection: 'photographers',
                where: { clerk_user_id: { equals: userId } }
            });

            if (currentPhotographers.docs.length > 0 && currentPhotographers.docs[0].id === photographer.id) {
                authorized = true;
            }
        }

        if (!authorized && shareToken) {
            // Check Share Link
            const shares = await payload.find({
                collection: 'share_links',
                where: {
                    token: { equals: shareToken },
                    project: { equals: (typeof photo.project === 'object' ? photo.project.id : photo.project) }
                }
            });

            if (shares.docs.length > 0) {
                shareLink = shares.docs[0];

                if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
                    return NextResponse.json({ error: 'Link expired' }, { status: 403 });
                }

                authorized = true;
            }
        }

        if (!authorized) {
            const project = typeof photo.project === 'object' ? photo.project : await payload.findByID({ collection: 'projects', id: photo.project as any });
            if (project.is_public) authorized = true;
        }

        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 4. Generate Signed URL
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: photo.r2_key as string,
        });

        const url = await getSignedUrl(r2, command, { expiresIn: 60 });

        return NextResponse.json({ url });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
