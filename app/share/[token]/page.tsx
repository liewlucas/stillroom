import { getAdminDirectus } from '@/lib/directus';
import { readItems, readItem } from '@directus/sdk';
import { notFound, redirect } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Photo } from '@/components/photo';

export const runtime = 'edge';

// /share/[token]
export default async function SharedGalleryPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const client = getAdminDirectus();

    // 1. Validate Token
    const shares = await client.request(readItems('share_links', {
        filter: { token: { _eq: token } }
    }));

    if (!shares || shares.length === 0) {
        notFound();
    }
    const share = shares[0];

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
    const project = await client.request(readItem('projects', share.project_id));
    const photographer = await client.request(readItem('photographers', project.photographer_id));

    // User Instructions: "URL structure ... /share/[token]".
    // It should probably redirect to /[username]/[projectSlug]?token=[token] ?
    // Or render the gallery here.
    // Rendering here is fine.

    const photos = await client.request(readItems('photos', {
        filter: { project_id: { _eq: project.id } },
        sort: ['created_at']
    }));

    return (
        <main>
            <Navigation />
            <div className="container" style={{ paddingTop: '2rem' }}>
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{project.title}</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>Shared by {photographer.display_name}</p>
                </header>

                <div className="grid">
                    {photos.map((photo) => (
                        <div key={photo.id} style={{
                            aspectRatio: `${photo.width}/${photo.height}`,
                            backgroundColor: 'var(--muted)',
                            borderRadius: 'var(--radius)',
                            overflow: 'hidden',
                        }}>
                            <Photo photoId={photo.id} token={token} />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
