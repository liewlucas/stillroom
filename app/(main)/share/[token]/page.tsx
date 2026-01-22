import { getPayloadClient } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Photo } from '@/components/photo';

export const runtime = 'nodejs';

// /share/[token]
export default async function SharedGalleryPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const payload = await getPayloadClient();

    // 1. Validate Token
    const shares = await payload.find({
        collection: 'share_links',
        where: { token: { equals: token } }
    });

    if (!shares.docs || shares.docs.length === 0) {
        notFound();
    }
    const share = shares.docs[0];

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return (
            <main>
                <Navigation />
                <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <h1>Link Expired</h1>
                </div>
            </main>
        );
    }

    // 2. Fetch Project & Photos
    // Resolving relationships
    const project = typeof share.project === 'object' ? share.project : await payload.findByID({ collection: 'projects', id: share.project as any });
    const photographer = typeof project.photographer === 'object' ? project.photographer : await payload.findByID({ collection: 'photographers', id: project.photographer as any });

    const photos = await payload.find({
        collection: 'photos',
        where: { project: { equals: project.id } },
        limit: 100,
    });

    return (
        <main>
            <Navigation />
            <div className="container py-12">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
                    <p className="text-muted-foreground">Shared by {photographer.display_name}</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.docs.map((photo) => (
                        <div key={photo.id} className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
                            <Photo photoId={String(photo.id)} token={token} />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
