'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderOpen, ArrowRight, CheckCircle2, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Define Gallery Type locally or import if available
interface Gallery {
    id: string;
    title: string;
    description?: string;
    slug: string;
    createdAt: string;
}

interface GalleryManagerProps {
    galleries: Gallery[];
}

export function GalleryManager({ galleries }: GalleryManagerProps) {
    const router = useRouter();
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Edit State
    const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [galleryToDelete, setGalleryToDelete] = useState<string | null>(null); // For single delete via menu

    // Selection Logic
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

    // Edit Logic
    const handleEditClick = (gallery: Gallery) => {
        setEditingGallery(gallery);
        setEditForm({
            title: gallery.title,
            description: gallery.description || ''
        });
        setIsEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingGallery) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/galleries/${editingGallery.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (!res.ok) throw new Error('Failed to update gallery');

            toast.success('Gallery updated');
            setIsEditOpen(false);
            setEditingGallery(null);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update gallery');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete Logic
    const confirmDelete = (id?: string) => {
        if (id) {
            // Single delete from menu
            setGalleryToDelete(id);
            setIsDeleteOpen(true);
        } else {
            // Bulk delete from selection
            if (selectedIds.size === 0) return;
            setIsDeleteOpen(true);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const idsToDelete = galleryToDelete ? [galleryToDelete] : Array.from(selectedIds);

            // Process deletes in parallel
            await Promise.all(idsToDelete.map(async (id) => {
                const res = await fetch(`/api/galleries/${id}`, { method: 'DELETE' });
                if (!res.ok) {
                    throw new Error(`Failed to delete gallery ${id}`);
                }
                return id;
            }));

            toast.success('Gallery deleted');
            setIsDeleteOpen(false);
            setGalleryToDelete(null);
            setSelectedIds(new Set());
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete gallery');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-muted-foreground">
                    {galleries.length} {galleries.length === 1 ? 'Gallery' : 'Galleries'}
                </div>
                {galleries.length > 0 && (
                    <Button
                        variant={isSelectionMode ? "secondary" : "outline"}
                        size="sm"
                        onClick={toggleSelectionMode}
                        className={cn("transition-all", isSelectionMode && "bg-muted text-foreground")}
                    >
                        {isSelectionMode ? 'Cancel Selection' : 'Select Galleries'}
                    </Button>
                )}
            </div>

            {/* Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {galleries.map((gallery) => {
                    const isSelected = selectedIds.has(gallery.id);

                    return (
                        <div key={gallery.id} className="relative group h-full">
                            {/* Card Content or Link */}
                            {/* We wrap the content in a Link only if NOT in selection mode */}
                            <div
                                onClick={(e) => {
                                    if (isSelectionMode) {
                                        e.preventDefault();
                                        toggleSelection(gallery.id);
                                    }
                                }}
                                className={cn(
                                    "h-full block p-6 border rounded-xl bg-card text-card-foreground shadow-sm transition-all duration-200 relative overflow-hidden",
                                    !isSelectionMode && "hover:shadow-md hover:border-primary/50 group-hover:-translate-y-0.5",
                                    isSelectionMode && "cursor-pointer",
                                    isSelected && "ring-2 ring-primary ring-offset-2 border-primary"
                                )}
                            >
                                {/* Selection Checkbox */}
                                {isSelectionMode && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <div
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all bg-card",
                                                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                                            )}
                                        >
                                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                        </div>
                                    </div>
                                )}

                                {/* Menu Action (Only when NOT in selection mode) */}
                                {!isSelectionMode && (
                                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditClick(gallery)}>
                                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => confirmDelete(gallery.id)} className="text-red-600 focus:text-red-600">
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}

                                {/* Main Content Area - Clickable Link wrapper only if not selecting */}
                                {isSelectionMode ? (
                                    // Div version for selection mode
                                    <div className="h-full flex flex-col pointer-events-none">
                                        {renderCardContent(gallery)}
                                    </div>
                                ) : (
                                    // Link version for navigation
                                    <Link href={`/dashboard/galleries/${gallery.id}`} className="h-full flex flex-col">
                                        {renderCardContent(gallery)}
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selection Floating Bar */}
            {isSelectionMode && selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    <span className="font-medium text-sm mr-2">{selectedIds.size} selected</span>

                    <div className="h-4 w-px bg-background/20 mx-2" />

                    {selectedIds.size === 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const id = Array.from(selectedIds)[0];
                                const gallery = galleries.find(g => g.id === id);
                                if (gallery) handleEditClick(gallery);
                            }}
                            className="h-8 hover:bg-white/10"
                        >
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete()}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8"
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setIsSelectionMode(false);
                            setSelectedIds(new Set());
                        }}
                        className="h-8 w-8 ml-2 hover:bg-white/10 rounded-full"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Gallery</DialogTitle>
                        <DialogDescription>Update the gallery details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Gallery Name</Label>
                            <Input
                                id="title"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            {/* User requested same fields as creation, which uses Input */}
                            <Input
                                id="description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Gallery</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {galleryToDelete ? 'this gallery' : `${selectedIds.size} galleries`}?
                            This action cannot be undone and will delete all photos within the gallery.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function renderCardContent(gallery: Gallery) {
    return (
        <>
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-primary/5 rounded-md">
                    <FolderOpen className="w-5 h-5 text-primary" />
                </div>
            </div>

            <h3 className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                {gallery.title}
            </h3>
            {gallery.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {gallery.description}
                </p>
            )}
            <div className="text-sm text-muted-foreground mt-1 font-mono text-xs opacity-70 truncate">
                /{gallery.slug}
            </div>

            <div className="mt-auto pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(gallery.createdAt).toLocaleDateString()}</span>
                {/* <span>View &rarr;</span> removed view arrow to reduce clutter or keep simple */}
            </div>
        </>
    );
}
