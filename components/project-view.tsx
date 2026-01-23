'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Photo } from '@/components/photo';
import { ProjectUploader } from '@/components/project-uploader';
import { ProjectLightbox } from '@/components/project-lightbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    project: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photos: any[];
    sidebarSlot: React.ReactNode;
}

export function ProjectView({ project, photos, sidebarSlot }: ProjectViewProps) {
    const router = useRouter();
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
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
                    projectId: project.id
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

    const handleDownload = async () => {
        if (selectedIds.size === 0) return;

        setIsDownloading(true);
        try {
            const response = await fetch('/api/photos/bulk-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoIds: Array.from(selectedIds),
                    projectId: project.id
                })
            });

            if (!response.ok) throw new Error('Download failed');

            // Handle blob download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photos-${project.title.toLowerCase().replace(/\s+/g, '-')}.zip`;
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
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <Link href="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Projects
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {photos.length > 0 && (
                        <Button
                            variant={isSelectionMode ? "secondary" : "outline"}
                            onClick={toggleSelectionMode}
                            className={cn("transition-all", isSelectionMode && "bg-muted text-foreground")}
                        >
                            {isSelectionMode ? 'Cancel' : 'Select'}
                        </Button>
                    )}
                    <ProjectUploader projectId={project.id} />
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                {/* Gallery Column */}
                <div className="relative">
                    {photos.length === 0 ? (
                        <div className="border-2 border-dashed rounded-xl p-12 text-center bg-muted/10">
                            <p className="text-muted-foreground mb-4">No photos in this project yet.</p>
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
                        <ProjectLightbox
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

                {/* Sidebar Column */}
                <aside className="space-y-6">
                    {sidebarSlot}
                </aside>
            </div>
        </div>
    );
}
