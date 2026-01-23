'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Photo } from '@/components/photo';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { GalleryLightbox } from '@/components/gallery-lightbox';

interface GalleryGridProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photos: any[];
    galleryId: string;
}

export function GalleryGrid({ photos, galleryId }: GalleryGridProps) {
    const router = useRouter();
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
            // Exit selection mode - clear selection
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
                    projectId: galleryId // Keeping 'projectId' key if API expects it, but variable is galleryId
                })
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Photos deleted successfully');
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete photos');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            {photos.length > 0 && (
                <div className="flex justify-end">
                    <Button
                        variant={isSelectionMode ? "secondary" : "ghost"}
                        size="sm"
                        onClick={toggleSelectionMode}
                        className={cn("transition-all", isSelectionMode && "bg-muted text-foreground")}
                    >
                        {isSelectionMode ? 'Cancel Selection' : 'Select Photos'}
                    </Button>
                </div>
            )}

            <div className="relative">
                {photos.length === 0 ? (
                    <div className="border-2 border-dashed rounded-xl p-12 text-center bg-muted/10">
                        <p className="text-muted-foreground mb-4">No photos in this gallery yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map((photo, index) => {
                            const isSelected = selectedIds.has(String(photo.id));

                            return (
                                <div
                                    key={photo.id}
                                    className={cn(
                                        "aspect-square bg-muted rounded-lg overflow-hidden relative group border shadow-sm transition-all",
                                        isSelected && "ring-2 ring-primary ring-offset-2",
                                        !isSelectionMode && "hover:shadow-md cursor-zoom-in"
                                    )}
                                    onClick={() => {
                                        if (isSelectionMode) {
                                            toggleSelection(String(photo.id));
                                        } else {
                                            setLightboxIndex(index);
                                        }
                                    }}
                                >
                                    {/* Selection Overlay (Only visible in Selection Mode) */}
                                    {isSelectionMode && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <div
                                                className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all bg-black/20 hover:bg-black/40 border-white",
                                                    isSelected && "bg-primary border-primary text-primary-foreground hover:bg-primary",
                                                    !isSelected && "bg-black/20 hover:bg-black/40"
                                                )}
                                            >
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    )}

                                    {/* Photo Content */}
                                    <div className={cn(
                                        "w-full h-full transition-transform duration-300",
                                        !isSelectionMode && "group-hover:scale-105",
                                        isSelectionMode && "pointer-events-none"
                                    )}>
                                        <Photo photoId={String(photo.id)} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Lightbox */}
                {lightboxIndex !== null && (
                    <GalleryLightbox
                        photos={photos}
                        initialIndex={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                    />
                )}

                {/* Floating Action Bar */}
                {isSelectionMode && selectedIds.size > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-foreground text-background px-6 py-3 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-4">
                        <span className="font-medium text-sm">{selectedIds.size} selected</span>

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
        </div>
    );
}
