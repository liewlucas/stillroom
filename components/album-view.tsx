'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Trash2, Download, Link as LinkIcon, Share, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Photo } from '@/components/photo';
import { PhotoUploader } from '@/components/photo-uploader';
import { PhotoLightbox } from '@/components/photo-lightbox';
import { ShareLinkList, ShareLinkCreator, type ShareLink } from '@/components/share-generator';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface AlbumViewProps {
    album: {
        id: string | number;
        title: string;
        description?: string | null;
        createdAt: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photos: any[];
    shareLinks: ShareLink[];
    username: string;
}

export function AlbumView({ album, photos, shareLinks, username }: AlbumViewProps) {
    const router = useRouter();
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [linksOpen, setLinksOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [links, setLinks] = useState<ShareLink[]>(shareLinks);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectionMode = () => {
        if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } else {
            setIsSelectionMode(true);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedIds.size} photos? This cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch('/api/photos/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoIds: Array.from(selectedIds),
                    projectId: album.id, // JSON body key the API expects — do not rename
                })
            });

            if (!res.ok) {
                // Surface the server's message — it explains actionable failures
                // like exceeding the per-request delete limit.
                let message = 'Failed to delete photos';
                try {
                    const data = await res.json();
                    if (typeof data?.error === 'string') message = data.error;
                } catch { /* non-JSON response; keep the generic message */ }
                throw new Error(message);
            }

            toast.success('Photos deleted successfully');
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete photos');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownload = async () => {
        if (selectedIds.size === 0) return;

        setIsDownloading(true);
        try {
            const response = await fetch('/api/photos/bulk-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoIds: Array.from(selectedIds),
                    projectId: album.id, // JSON body key the API expects — do not rename
                })
            });

            if (!response.ok) throw new Error('Download failed');

            // Handle blob download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photos-${album.title.toLowerCase().replace(/\s+/g, '-')}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Download started');
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } catch (error) {
            console.error(error);
            toast.error('Failed to download photos');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="w-full px-6 py-8 md:px-12 md:py-12">
            {/* Header */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between mb-10">
                <div className="min-w-0">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">{album.title}</h1>
                    <p className="text-muted-foreground mt-2">
                        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · Created {formatDate(album.createdAt)}
                    </p>
                    {album.description && (
                        <p className="text-muted-foreground/80 text-sm mt-1 max-w-2xl text-pretty">{album.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {/* Shared links — opens the full list */}
                    <Button
                        variant="outline"
                        className="rounded-full pl-4 pr-3 gap-2 shadow-sm"
                        onClick={() => setLinksOpen(true)}
                    >
                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                        Shared Links
                        {links.length > 0 && (
                            <span className="min-w-5 h-5 px-1.5 rounded-full bg-muted text-[11px] font-medium tabular-nums flex items-center justify-center">
                                {links.length}
                            </span>
                        )}
                    </Button>

                    {/* Share — opens the create-a-new-link form */}
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        aria-label="Create a new share link"
                        title="Create a new share link"
                        className="w-9 h-9 rounded-full border border-border bg-background hover:bg-card transition-colors flex items-center justify-center shadow-sm"
                    >
                        <Share className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {photos.length > 0 && (
                        <Button
                            variant={isSelectionMode ? 'secondary' : 'ghost'}
                            onClick={toggleSelectionMode}
                            className={cn('rounded-full px-5 transition-all', isSelectionMode && 'bg-muted text-foreground')}
                        >
                            {isSelectionMode ? 'Cancel' : 'Select'}
                        </Button>
                    )}

                    <PhotoUploader projectId={album.id} />
                </div>
            </div>

            {/* Mosaic grid */}
            <div className="relative">
                {photos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-card/40">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <ImageIcon className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No photos yet</h3>
                        <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
                            Upload photos to bring this album to life.
                        </p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 xl:columns-4 gap-3">
                        {photos.map((photo, index) => {
                            const id = String(photo.id);
                            const isSelected = selectedIds.has(id);
                            const w = photo.web_width ?? photo.width;
                            const h = photo.web_height ?? photo.height;
                            const aspectRatio = w && h ? `${w} / ${h}` : '4 / 5';

                            return (
                                <div
                                    key={id}
                                    className={cn(
                                        'mb-3 break-inside-avoid rounded-xl overflow-hidden relative group bg-muted transition-all',
                                        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                                        !isSelectionMode && 'cursor-zoom-in hover:shadow-md'
                                    )}
                                    style={{ aspectRatio }}
                                    onClick={() => {
                                        if (isSelectionMode) {
                                            toggleSelection(id);
                                        } else {
                                            setLightboxIndex(index);
                                        }
                                    }}
                                >
                                    {/* Selection overlay (only visible in selection mode) */}
                                    {isSelectionMode && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <div
                                                className={cn(
                                                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all border-white',
                                                    isSelected && 'bg-primary border-primary text-primary-foreground hover:bg-primary',
                                                    !isSelected && 'bg-black/20 hover:bg-black/40'
                                                )}
                                            >
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    )}

                                    {/* Photo content */}
                                    <div
                                        className={cn(
                                            'w-full h-full',
                                            !isSelectionMode && 'transition-transform duration-300 group-hover:scale-[1.03]',
                                            isSelectionMode && 'pointer-events-none'
                                        )}
                                    >
                                        <Photo photoId={id} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Lightbox */}
                {lightboxIndex !== null && (
                    <PhotoLightbox
                        photos={photos}
                        initialIndex={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                    />
                )}

                {/* Floating action bar */}
                {isSelectionMode && selectedIds.size > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-foreground text-background px-6 py-3 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-4">
                        <span className="font-medium text-sm">{selectedIds.size} selected</span>

                        <div className="h-4 w-px bg-background/20" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="text-background hover:bg-background/20 hover:text-background"
                        >
                            {isDownloading ? 'Zipping...' : (
                                <>
                                    <Download className="w-4 h-4 mr-2" /> Download
                                </>
                            )}
                        </Button>

                        <div className="h-4 w-px bg-background/20" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8"
                        >
                            {isDeleting ? 'Deleting...' : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Shared links — the full list */}
            <Dialog open={linksOpen} onOpenChange={setLinksOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Shared links</DialogTitle>
                        <DialogDescription>
                            Anyone with one of these links can view and download this album.
                        </DialogDescription>
                    </DialogHeader>
                    <ShareLinkList
                        links={links}
                        username={username}
                        onDeleted={(id) => setLinks((prev) => prev.filter((l) => l.id !== id))}
                        onCreateNew={() => {
                            setLinksOpen(false);
                            setCreateOpen(true);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Share — create a new link */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create a share link</DialogTitle>
                        <DialogDescription>
                            Generate a link that lets anyone view and download this album.
                        </DialogDescription>
                    </DialogHeader>
                    <ShareLinkCreator
                        galleryId={String(album.id)}
                        username={username}
                        onCreated={(link) => {
                            setLinks((prev) => [link, ...prev]);
                            // Hand off to the list so the new link can be copied
                            // straight away — creating one is rarely the end goal.
                            setCreateOpen(false);
                            setLinksOpen(true);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
