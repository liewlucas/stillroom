import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { ImageIcon, Plus } from 'lucide-react';

import { getAlbumsForUser, type AlbumSummary } from '@/lib/albums';
import { Photo } from '@/components/photo';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export const runtime = 'nodejs'; // Payload
export const dynamic = 'force-dynamic';

export default async function AlbumsOverviewPage() {
    const { userId } = await auth();
    if (!userId) return null;

    let albums: AlbumSummary[] = [];
    try {
        const data = await getAlbumsForUser(userId);
        albums = data.albums;
    } catch (e) {
        console.error('Failed to fetch albums', e);
    }

    return (
        <div className="w-full px-6 py-8 md:px-12 md:py-12">
            <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your albums</h1>
                <p className="text-muted-foreground mt-2">
                    {albums.length === 0
                        ? 'Create your first album to start delivering photos.'
                        : 'Pick an album from the sidebar, or browse them below.'}
                </p>
            </div>

            {albums.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-card/40">
                    <div className="p-4 bg-muted rounded-full mb-4">
                        <ImageIcon className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No albums yet</h3>
                    <p className="text-muted-foreground mt-1 mb-5 max-w-xs mx-auto">
                        An album is a private space for a shoot — upload photos, then share them with a link.
                    </p>
                    <Link href="/dashboard/albums/new">
                        <Button className="rounded-full px-5 shadow-sm">
                            <Plus className="w-4 h-4 mr-2" /> New album
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {albums.map((album) => (
                        <Link
                            key={album.id}
                            href={`/dashboard/albums/${album.id}`}
                            className="group"
                        >
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-sm transition-shadow group-hover:shadow-md">
                                {album.coverPhotoId ? (
                                    <div className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]">
                                        <Photo photoId={album.coverPhotoId} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
                                    </div>
                                )}
                            </div>
                            <h3 className="mt-3 font-semibold tracking-tight truncate">{album.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'} · {formatDate(album.createdAt)}
                            </p>
                        </Link>
                    ))}

                    <Link
                        href="/dashboard/albums/new"
                        className="group flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed text-muted-foreground hover:text-foreground hover:bg-card/40 transition-colors"
                    >
                        <Plus className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">New album</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
