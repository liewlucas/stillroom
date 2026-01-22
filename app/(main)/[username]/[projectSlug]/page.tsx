import { getPayloadClient } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Photo } from '@/components/photo';

export const runtime = 'nodejs';

export default async function GalleryPage({ params }: { params: Promise<{ username: string; projectSlug: string }> }) {
    const { username, projectSlug } = await params;

    const payload = await getPayloadClient();

    const photographers = await payload.find({
        collection: 'photographers',
        where: { username: { equals: username } }
    });

    if (!photographers.docs || photographers.docs.length === 0) {
        notFound();
    }
    const photographer = photographers.docs[0];

    // 2. Find Project
    const projects = await payload.find({
        collection: 'projects',
        where: {
            and: [
                { photographer: { equals: photographer.id } },
                { slug: { equals: projectSlug } }
            ]
        }
    });

    if (!projects.docs || projects.docs.length === 0) {
        notFound();
    }
    const project = projects.docs[0];

    // 3. Check Visibility
    if (!project.is_public) {
        // Handle private (Assuming user needs authentication or token if here)
    }

    // 4. Fetch Photos
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
                    <p style={{ color: 'var(--muted-foreground)' }}>by {photographer.display_name}</p>
                </header>

                <div className="grid" style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1rem'
                }}>
                    {photos.docs.map((photo) => {
                        const r2Key = typeof photo.r2_key === 'string' ? photo.r2_key : '';
                        const photoId = r2Key.split('/').pop()?.replace('.jpg', '') || String(photo.id);
                        return (
                            <div key={photo.id} style={{
                                aspectRatio: typeof photo.width === 'number' && typeof photo.height === 'number' ? `${photo.width}/${photo.height}` : '1/1',
                                backgroundColor: 'var(--muted)',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <Photo photoId={photoId} />
                            </div>
                        )
                    })}
                </div>
            </div>
        </main>
    );
}
