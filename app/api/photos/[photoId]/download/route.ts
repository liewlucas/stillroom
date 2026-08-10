import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/data';
import { auth } from '@clerk/nextjs/server';
import { PhotoVariant } from '@/lib/photo-variants';
import { signPhotoUrl } from '@/lib/photo-urls';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
    const { photoId } = await params;

    const searchParams = req.nextUrl.searchParams;
    const shareToken = searchParams.get('token');
    const requestedVariant = searchParams.get('variant');
    const variant: PhotoVariant = requestedVariant === 'web' || requestedVariant === 'full'
        ? requestedVariant
        : 'high';
    // Callers that intend to save the file ask for a download-flavoured URL; the
    // grid, lightbox and hero leave this off and get a plain viewing URL.
    const disposition = searchParams.get('disposition') === 'attachment' ? 'attachment' as const : undefined;

    if (!photoId) {
        return NextResponse.json({ error: 'Missing Photo ID' }, { status: 400 });
    }

    try {
        const payload = await getPayloadClient();

        // 1. Fetch Photo Metadata
        let photo = null;
        try {
            photo = await payload.findByID({
                collection: 'photos',
                id: photoId
            });
        } catch {
            photo = null;
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
        const signed = await signPhotoUrl(photo, { variant, disposition });
        if (!signed) {
            return NextResponse.json({ error: 'Photo file not found' }, { status: 404 });
        }

        // filename and contentType let the client build a real File for the native
        // share sheet — iOS drops "Save Image" if either one is missing or wrong.
        return NextResponse.json({
            url: signed.url,
            filename: signed.filename,
            contentType: signed.contentType,
            variant: signed.variant,
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
