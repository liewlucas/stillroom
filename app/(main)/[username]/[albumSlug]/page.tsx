import { getPayloadClient } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Photo } from '@/components/photo';

export const runtime = 'nodejs';

export default async function AlbumPage({ params }: { params: Promise<{ username: string; albumSlug: string }> }) {
    const { username, albumSlug } = await params;

    const payload = await getPayloadClient();

    const photographers = await payload.find({
        collection: 'photographers',
        where: { username: { equals: username } }
    });

    if (!photographers.docs || photographers.docs.length === 0) {
        notFound();
    }
    const photographer = photographers.docs[0];

    // 2. Find album
    const albums = await payload.find({
        collection: 'galleries',
        where: {
            and: [
                { photographer: { equals: photographer.id } },
                { slug: { equals: albumSlug } }
            ]
        }
    });

    if (!albums.docs || albums.docs.length === 0) {
        notFound();
    }
    const album = albums.docs[0];

    // 3. Check Visibility
    if (!album.is_public) {
        // Handle private (Assuming user needs authentication or token if here)
    }

    // 4. Fetch Photos
    const photos = await payload.find({
        collection: 'photos',
        where: { project: { equals: album.id } }, // Keeping 'project' field on Photos collection for now
        limit: 100,
    });

    return (
        <main>
            <Navigation />
            <div className="container py-12">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
                    {album.description && <p className="text-lg text-muted-foreground mb-2">{album.description}</p>}
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
