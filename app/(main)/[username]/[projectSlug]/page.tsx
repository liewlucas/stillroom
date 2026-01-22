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
            <div className="container py-12">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
                    <p className="text-muted-foreground">by {photographer.display_name}</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.docs.map((photo) => (
                        <div key={photo.id} className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
                            <Photo photoId={String(photo.id)} />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
