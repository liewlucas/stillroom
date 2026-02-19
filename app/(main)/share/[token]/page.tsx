import { getPayloadClient } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';

export const runtime = 'nodejs';

export default async function SharedGalleryRedirect({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const payload = await getPayloadClient();

    const shares = await payload.find({
        collection: 'share_links',
        where: { token: { equals: token } },
    });

    if (!shares.docs || shares.docs.length === 0) {
        notFound();
    }
    const share = shares.docs[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gallery = typeof share.gallery === 'object' ? share.gallery : await payload.findByID({ collection: 'galleries', id: share.gallery as any });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photographer = typeof gallery.photographer === 'object' ? gallery.photographer : await payload.findByID({ collection: 'photographers', id: gallery.photographer as any });

    redirect(`/${photographer.username}/share/${token}`);
}
