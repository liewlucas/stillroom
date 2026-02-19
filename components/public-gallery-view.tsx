'use client';

import { useState } from 'react';
import { Camera, Download, CheckSquare, Square, X } from 'lucide-react';
import { Photo } from '@/components/photo';
import { GalleryLightbox } from '@/components/gallery-lightbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PublicPhoto {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface PublicGalleryViewProps {
    gallery: { title: string; description?: string | null };
    photographer: { display_name?: string | null };
    photos: PublicPhoto[];
    token: string;
    galleryId: string;
}

export function PublicGalleryView({ gallery, photographer, photos, token, galleryId }: PublicGalleryViewProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [downloading, setDownloading] = useState(false);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(photos.map((p) => String(p.id))));
    const clearSelection = () => setSelectedIds(new Set());

    const enterSelectMode = () => {
        setSelectMode(true);
        setSelectedIds(new Set());
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
    };

    const handlePhotoClick = (index: number, id: string) => {
        if (selectMode) {
            toggleSelect(id);
        } else {
            setLightboxIndex(index);
        }
    };

    const download = async () => {
        if (selectedIds.size === 0) return;
        setDownloading(true);
        try {
            const res = await fetch('/api/photos/bulk-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoIds: Array.from(selectedIds),
                    projectId: galleryId,
                    token,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Download failed');
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${gallery.title.replace(/\s+/g, '-').toLowerCase()}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`${selectedIds.size} photo${selectedIds.size === 1 ? '' : 's'} downloaded`);
        } catch {
            toast.error('Download failed');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 text-center max-w-2xl mx-auto w-full">
                {photographer.display_name && (
                    <div className="flex items-center justify-center gap-1.5 mb-5 text-muted-foreground">
                        <Camera className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium tracking-wide">{photographer.display_name}</span>
                    </div>
                )}
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{gallery.title}</h1>
                {gallery.description && (
                    <p className="text-muted-foreground text-base leading-relaxed">{gallery.description}</p>
                )}
                <div className="flex items-center justify-center gap-4 mt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                    </p>
                    {photos.length > 0 && !selectMode && (
                        <button
                            onClick={enterSelectMode}
                            className="text-xs text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            <CheckSquare className="w-3 h-3" /> Select
                        </button>
                    )}
                </div>
            </header>

            {/* Divider */}
            <div className="w-12 h-px bg-border mx-auto mb-6" />

            {/* Photo Grid */}
            <div className="flex-1 px-1 pb-32">
                {photos.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>No photos in this gallery yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5">
                        {photos.map((photo, index) => {
                            const id = String(photo.id);
                            const selected = selectedIds.has(id);
                            return (
                                <div
                                    key={id}
                                    className="relative aspect-square bg-muted overflow-hidden cursor-pointer group"
                                    onClick={() => handlePhotoClick(index, id)}
                                >
                                    <Photo
                                        photoId={id}
                                        token={token}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {selectMode && (
                                        <div className={`absolute inset-0 transition-colors ${selected ? 'bg-primary/30' : 'bg-transparent'}`}>
                                            <div className="absolute top-2 left-2">
                                                {selected
                                                    ? <CheckSquare className="w-5 h-5 text-white drop-shadow" />
                                                    : <Square className="w-5 h-5 text-white/70 drop-shadow" />
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="py-8 text-center border-t">
                <p className="text-xs text-muted-foreground">
                    Delivered by <span className="font-semibold text-foreground">Stillroom</span>
                </p>
            </footer>

            {/* Selection action bar */}
            {selectMode && (
                <div className="fixed bottom-0 inset-x-0 z-50 bg-background border-t shadow-lg px-4 py-3">
                    <div className="max-w-2xl mx-auto flex items-center gap-3">
                        <span className="text-sm font-medium flex-1">
                            {selectedIds.size > 0
                                ? `${selectedIds.size} selected`
                                : 'Tap photos to select'}
                        </span>
                        <button
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={selectedIds.size === photos.length ? clearSelection : selectAll}
                        >
                            {selectedIds.size === photos.length ? 'Deselect all' : 'Select all'}
                        </button>
                        <Button
                            size="sm"
                            disabled={selectedIds.size === 0 || downloading}
                            onClick={download}
                        >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            {downloading ? 'Downloading...' : 'Download'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={exitSelectMode}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <GalleryLightbox
                    photos={photos}
                    initialIndex={lightboxIndex}
                    token={token}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
}
