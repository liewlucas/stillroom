import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';

import { ShareGenerator } from '@/components/share-generator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { GalleryView } from '@/components/gallery-view';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function GalleryPage({ params }: { params: Promise<{ galleryId: string }> }) {
    const { galleryId } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const payload = await getPayloadClient();

    // 1. Fetch Gallery
    let gallery;
    try {
        gallery = await payload.findByID({ collection: 'galleries', id: galleryId });
    } catch {
        notFound();
    }

    // 2. Authorization (Ensure owner)
    const photographers = await payload.find({
        collection: 'photographers',
        where: { clerk_user_id: { equals: userId } }
    });

    const ownerId = typeof gallery.photographer === 'object' ? gallery.photographer.id : gallery.photographer;

    if (!photographers.docs || photographers.docs.length === 0 || photographers.docs[0].id !== ownerId) {
        return (
            <main>
                <div className="w-full px-10 py-20 text-center">
                    <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
                    <p className="text-muted-foreground mt-2">You do not have permission to view this gallery.</p>
                    <Link href="/dashboard/galleries" className="mt-4 inline-block">
                        <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                </div>
            </main>
        );
    }

    // 3. Fetch Photos
    // Note: Photos are still related to 'project' (now relating to gallery conceptually)
    // but the field name in DB might still be 'project' if Payload didn't migrate column name?
    // I renamed 'project' to 'gallery' in ShareLinks, but in Photos.ts I think I also renamed it to 'gallery'.
    // However, if the field name changed in the schema, I must query by 'gallery'.
    // If the database has 'project' column mostly, payload might look for 'gallery' column now.
    // Assuming fresh table or migration handled by Payload dev mode (it creates new tables usually).

    const result = await payload.find({
        collection: 'photos',
        where: { project: { equals: galleryId } }, // Revert to query by 'project' field as I kept the NAME 'project' in Photos.ts to minimize noise, wait did I?
        // Let's check my previous edit to Photos.ts.
        // I checked Photos.ts edit. I changed 'relationTo' to 'galleries' but KEPT the name 'project' ?? 
        // "name: 'project', // Keeping the field name 'project' for now..."
        // So I must query by 'project'.
        limit: 100,
        sort: '-createdAt'
    });
    const photos = result.docs;

    const sidebarContent = (
        <>
            <ShareGenerator galleryId={galleryId} />

            <div className="p-4 border rounded-lg bg-card shadow-sm">
                <div className="flex items-center text-sm font-medium mb-3">
                    <Settings className="w-4 h-4 mr-2" /> Gallery Details
                </div>
                <dl className="text-sm space-y-3">
                    <div className="flex justify-between border-b pb-2">
                        <dt className="text-muted-foreground">Photos</dt>
                        <dd className="font-medium">{photos.length}</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <dt className="text-muted-foreground">Visibility</dt>
                        <dd className="font-medium">{gallery.is_public ? 'Public' : 'Private'}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">Created</dt>
                        <dd className="font-medium">{new Date(gallery.createdAt).toLocaleDateString()}</dd>
                    </div>
                    {gallery.description && (
                        <div className="pt-2">
                            <dt className="text-muted-foreground mb-1">Description</dt>
                            <dd className="font-medium text-xs text-pretty">{gallery.description}</dd>
                        </div>
                    )}
                </dl>
            </div>
        </>
    );

    return (
        <main>
            <div className="w-full px-10 py-10">
                <GalleryView gallery={gallery} photos={photos} sidebarSlot={sidebarContent} />
            </div>
        </main>
    );
}
