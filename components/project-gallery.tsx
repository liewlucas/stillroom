'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Photo } from '@/components/photo';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProjectGalleryProps {
    photos: any[];
    projectId: string;
}

export function ProjectGallery({ photos, projectId }: ProjectGalleryProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
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
                    projectId
                })
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Photos deleted successfully');
            setSelectedIds(new Set());
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete photos');
        } finally {
            setIsDeleting(false);
        }
    };

    const isSelectionMode = selectedIds.size > 0;

    return (
        <div className="relative">
            {photos.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl p-12 text-center bg-muted/10">
                    <p className="text-muted-foreground mb-4">No photos in this project yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => {
                        const isSelected = selectedIds.has(String(photo.id));

                        return (
                            <div
                                key={photo.id}
                                className={cn(
                                    "aspect-square bg-muted rounded-lg overflow-hidden relative group border shadow-sm transition-all",
                                    isSelected && "ring-2 ring-primary ring-offset-2"
                                )}
                            >
                                {/* Selection Overlay */}
                                <div
                                    className={cn(
                                        "absolute inset-0 z-10 cursor-pointer transition-colors",
                                        isSelected ? "bg-primary/20" : "bg-transparent group-hover:bg-black/10"
                                    )}
                                    // Clicking the overlay triggers selection. 
                                    // However, the Photo component has an onClick to open the lightbox.
                                    // We need to decide: does clicking the image OPEN it or SELECT it?
                                    // Let's add a dedicated checkbox for selection, and hold Shift or something?
                                    // Simplest UI: Checkbox in top-left.
                                    onClick={(e) => {
                                        // If in selection mode, clicking anywhere selects
                                        if (isSelectionMode) {
                                            e.stopPropagation();
                                            toggleSelection(String(photo.id));
                                        }
                                    }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelection(String(photo.id));
                                        }}
                                        className={cn(
                                            "absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all bg-black/20 hover:bg-black/40 border-white",
                                            isSelected ? "bg-primary border-primary text-primary-foreground hover:bg-primary" : "opacity-0 group-hover:opacity-100"
                                        )}
                                    >
                                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* We disable the Photo's internal click if we are in selection mode by passing a prop? 
                                    Or we just rely on the overlay z-index stealing the click if we want.
                                    Currently the overlay is absolute inset-0 z-10.
                                    Photo img is probably just in the flow.
                                    So clicking the overlay effectively intercepts the click.
                                */}
                                <div className={cn("w-full h-full", isSelectionMode && "pointer-events-none")}>
                                    <Photo photoId={String(photo.id)} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Floating Action Bar */}
            {selectedIds.size > 0 && (
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

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSelection}
                        className="h-8 w-8 ml-2 rounded-full hover:bg-background/20 text-background"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
