import { auth } from '@clerk/nextjs/server';

import { getPayloadClient } from '@/lib/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus } from 'lucide-react';
import { GalleryManager } from '@/components/gallery-manager';

export const runtime = 'nodejs'; // Payload

export const dynamic = 'force-dynamic';

export default async function GalleriesPage() {
    const { userId } = await auth();
    if (!userId) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let galleries: any[] = [];
    try {
        const payload = await getPayloadClient();
        const photographers = await payload.find({
            collection: 'photographers',
            where: { clerk_user_id: { equals: userId } }
        });
        const photographer = photographers.docs[0];
        if (photographer) {
            const result = await payload.find({
                collection: 'galleries',
                where: {
                    photographer: {
                        equals: photographer.id
                    }
                },
                sort: '-createdAt'
            });

            // Enrich each gallery with its first photo (for thumbnail) and photo count
            galleries = await Promise.all(
                result.docs.map(async (gallery) => {
                    const photos = await payload.find({
                        collection: 'photos',
                        where: { project: { equals: gallery.id } },
                        limit: 1,
                        sort: 'createdAt',
                    });
                    return {
                        ...gallery,
                        coverPhotoId: photos.docs[0]?.id ? String(photos.docs[0].id) : null,
                        photoCount: photos.totalDocs,
                    };
                })
            );
        }

    } catch (e) {
        console.error('Failed to fetch galleries', e);
    }

    return (
        <main>
            <div className="w-full px-10 py-10">
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Galleries</h1>
                        <p className="text-muted-foreground mt-1">Manage your photo collections.</p>
                    </div>
                    <Link href="/dashboard/galleries/new">
                        <Button className="shadow-sm">
                            <Plus className="w-4 h-4 mr-2" /> New Gallery
                        </Button>
                    </Link>
                </div>

                {galleries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-card">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <FolderOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No galleries yet</h3>
                        <p className="text-muted-foreground mb-4 max-w-xs mx-auto">
                            Create your first gallery to start delivering photos to clients.
                        </p>
                        <Link href="/dashboard/galleries/new">
                            <Button>Create Gallery</Button>
                        </Link>
                    </div>
                ) : (
                    <GalleryManager galleries={galleries} />
                )}
            </div>
        </main>
    );
}
