import { getPayloadClient } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Photo } from '@/components/photo';

export const runtime = 'nodejs';

export default async function GalleryPage({ params }: { params: Promise<{ username: string; gallerySlug: string }> }) {
    const { username, gallerySlug } = await params;

    const payload = await getPayloadClient();

    const photographers = await payload.find({
        collection: 'photographers',
        where: { username: { equals: username } }
    });

    if (!photographers.docs || photographers.docs.length === 0) {
        notFound();
    }
    const photographer = photographers.docs[0];

    // 2. Find Gallery
    const galleries = await payload.find({
        collection: 'galleries',
        where: {
            and: [
                { photographer: { equals: photographer.id } },
                { slug: { equals: gallerySlug } }
            ]
        }
    });

    if (!galleries.docs || galleries.docs.length === 0) {
        notFound();
    }
    const gallery = galleries.docs[0];

    // 3. Check Visibility
    if (!gallery.is_public) {
        // Handle private (Assuming user needs authentication or token if here)
    }

    // 4. Fetch Photos
    const photos = await payload.find({
        collection: 'photos',
        where: { project: { equals: gallery.id } }, // Keeping 'project' field on Photos collection for now
        limit: 100,
    });

    return (
        <main>
            <Navigation />
            <div className="container py-12">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-2">{gallery.title}</h1>
                    {gallery.description && <p className="text-lg text-muted-foreground mb-2">{gallery.description}</p>}
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
