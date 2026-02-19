'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';

import { DataTable } from '@/components/galleries/data-table';
import { getColumns, Gallery } from '@/components/galleries/columns';

interface GalleryManagerProps {
    galleries: Gallery[];
}

export function GalleryManager({ galleries }: GalleryManagerProps) {
    const router = useRouter();

    // Selection state (driven by DataTable)
    const [selectedGalleries, setSelectedGalleries] = useState<Gallery[]>([]);

    // Edit State
    const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [galleryToDelete, setGalleryToDelete] = useState<string | null>(null);

    // Edit Logic
    const handleEditClick = useCallback((gallery: Gallery) => {
        setEditingGallery(gallery);
        setEditForm({
            title: gallery.title,
            description: gallery.description || ''
        });
        setIsEditOpen(true);
    }, []);

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
    const confirmDelete = useCallback((id?: string) => {
        if (id) {
            setGalleryToDelete(id);
            setIsDeleteOpen(true);
        } else {
            if (selectedGalleries.length === 0) return;
            setIsDeleteOpen(true);
        }
    }, [selectedGalleries]);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const idsToDelete = galleryToDelete
                ? [galleryToDelete]
                : selectedGalleries.map(g => g.id);

            await Promise.all(idsToDelete.map(async (id) => {
                const res = await fetch(`/api/galleries/${id}`, { method: 'DELETE' });
                if (!res.ok) {
                    throw new Error(`Failed to delete gallery ${id}`);
                }
                return id;
            }));

            toast.success(idsToDelete.length === 1 ? 'Gallery deleted' : `${idsToDelete.length} galleries deleted`);
            setIsDeleteOpen(false);
            setGalleryToDelete(null);
            setSelectedGalleries([]);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete gallery');
        } finally {
            setIsDeleting(false);
        }
    };

    // Memoize columns so they don't recreate on every render
    const columns = useMemo(
        () => getColumns({
            onEdit: handleEditClick,
            onDelete: (id) => confirmDelete(id),
        }),
        [handleEditClick, confirmDelete]
    );

    return (
        <div>
            <DataTable
                columns={columns}
                data={galleries}
                onSelectionChange={setSelectedGalleries}
            />

            {/* Floating Action Bar for bulk operations */}
            {selectedGalleries.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    <span className="font-medium text-sm mr-2">{selectedGalleries.length} selected</span>

                    <div className="h-4 w-px bg-background/20 mx-2" />

                    {selectedGalleries.length === 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(selectedGalleries[0])}
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
                        onClick={() => setSelectedGalleries([])}
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
                            Are you sure you want to delete {galleryToDelete ? 'this gallery' : `${selectedGalleries.length} galleries`}?
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
