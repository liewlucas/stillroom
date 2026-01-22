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
            <div className="container" style={{ paddingTop: '2rem' }}>
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{project.title}</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>Shared by {photographer.display_name}</p>
                </header>

                <div className="grid">
                    {photos.docs.map((photo) => {
                        const r2Key = typeof photo.r2_key === 'string' ? photo.r2_key : '';
                        const photoId = r2Key.split('/').pop()?.replace('.jpg', '') || String(photo.id);
                        return (
                            <div key={photo.id} style={{
                                aspectRatio: typeof photo.width === 'number' && typeof photo.height === 'number' ? `${photo.width}/${photo.height}` : '1/1',
                                backgroundColor: 'var(--muted)',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden',
                            }}>
                                <Photo photoId={photoId} token={token} />
                            </div>
                        )
                    })}
                </div>
            </div>
        </main>
    );
}
