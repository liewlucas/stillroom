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
        let photo;
        try {
            // Try treating photoId as a direct Payload ID first
            photo = await payload.findByID({
                collection: 'photos',
                id: photoId
            });
        } catch {
            // If failed (e.g. invalid ID format or not found), try searching by R2 key (legacy/fallback)
            const photos = await payload.find({
                collection: 'photos',
                where: {
                    r2_key: { contains: photoId }
                }
            });
            if (photos.docs.length > 0) {
                photo = photos.docs[0];
            }
        }

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }

        // 2. Authorization Check
        let authorized = false;
        let shareLink = null;

        const { userId } = await auth();
        if (userId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const project = typeof photo.project === 'object' ? photo.project : await payload.findByID({ collection: 'galleries', id: photo.project as any });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    gallery: { equals: (typeof photo.project === 'object' ? photo.project.id : photo.project) }
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const project = typeof photo.project === 'object' ? photo.project : await payload.findByID({ collection: 'galleries', id: photo.project as any });
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
