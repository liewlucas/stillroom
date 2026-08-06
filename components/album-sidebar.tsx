'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Home, Images, ImageIcon, Menu, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Photo } from '@/components/photo';
import type { AlbumSummary } from '@/lib/albums';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AlbumSidebarProps {
    albums: AlbumSummary[];
    displayName: string | null;
}

export function AlbumSidebar({ albums, displayName }: AlbumSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams<{ albumId?: string }>();
    const activeAlbumId = params?.albumId ?? null;

    // Mobile drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    // Edit state (ported from the old gallery manager — same API calls)
    const [editingAlbum, setEditingAlbum] = useState<AlbumSummary | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Delete state
    const [albumToDelete, setAlbumToDelete] = useState<AlbumSummary | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const openEdit = (album: AlbumSummary) => {
        setEditingAlbum(album);
        setEditForm({ title: album.title, description: album.description || '' });
        setIsEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingAlbum) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/galleries/${editingAlbum.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (!res.ok) throw new Error('Failed to update album');

            toast.success('Album updated');
            setIsEditOpen(false);
            setEditingAlbum(null);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update album');
        } finally {
            setIsSaving(false);
        }
    };

    const openDelete = (album: AlbumSummary) => {
        setAlbumToDelete(album);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!albumToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/galleries/${albumToDelete.id}`, { method: 'DELETE' });
            if (!res.ok) {
                throw new Error(`Failed to delete album ${albumToDelete.id}`);
            }

            toast.success('Album deleted');
            setIsDeleteOpen(false);

            // If the open album was just deleted, don't leave the user on a 404.
            if (activeAlbumId === albumToDelete.id) {
                router.push('/dashboard/albums');
            }
            setAlbumToDelete(null);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete album');
        } finally {
            setIsDeleting(false);
        }
    };

    const sidebarContent = (
        <>
            {/* Wordmark */}
            <Link href="/dashboard/albums" className="px-3 text-xl font-bold tracking-tight lowercase">
                stillroom
            </Link>

            {/* Primary nav */}
            <nav className="mt-6 space-y-0.5">
                <SidebarNavItem href="/" icon={<Home className="w-4 h-4" />} label="Home" active={false} />
                <SidebarNavItem
                    href="/dashboard/albums"
                    icon={<Images className="w-4 h-4" />}
                    label="Albums"
                    active={pathname === '/dashboard/albums'}
                />
            </nav>

            {/* Album list */}
            <p className="mt-7 mb-2 px-3 text-xs font-medium text-muted-foreground">Your albums</p>
            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-0.5">
                {albums.map((album) => {
                    const active = activeAlbumId === album.id;
                    return (
                        <div
                            key={album.id}
                            className={cn(
                                'group flex items-center rounded-full pr-1 transition-colors',
                                active ? 'bg-card' : 'hover:bg-card/60'
                            )}
                        >
                            <Link
                                href={`/dashboard/albums/${album.id}`}
                                className="flex flex-1 min-w-0 items-center gap-2.5 px-2 py-1.5"
                            >
                                <span className="w-7 h-7 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                                    {album.coverPhotoId ? (
                                        <Photo photoId={album.coverPhotoId} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                </span>
                                <span className={cn('text-sm truncate', active ? 'font-medium' : 'text-foreground/80')}>
                                    {album.title}
                                </span>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            'h-7 w-7 rounded-full shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
                                            active && 'opacity-100'
                                        )}
                                        aria-label={`Options for ${album.title}`}
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" side="right">
                                    <DropdownMenuItem onClick={() => openEdit(album)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => openDelete(album)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                })}

                {/* New album */}
                <Link
                    href="/dashboard/albums/new"
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
                >
                    <span className="w-7 h-7 rounded-full border border-dashed border-muted-foreground/40 shrink-0 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-sm">New album</span>
                </Link>
            </div>

            {/* Signed-in user */}
            <div className="mt-4 pt-4 border-t border-border/50 px-2 flex items-center gap-2.5">
                <UserButton afterSignOutUrl="/" />
                {displayName && (
                    <span className="text-sm font-medium truncate">{displayName}</span>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-[250px] shrink-0 flex-col sticky top-0 h-screen bg-background border-r border-border/40 px-3 py-6">
                {sidebarContent}
            </aside>

            {/* Mobile top bar */}
            <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 bg-background/95 backdrop-blur border-b border-border/40">
                <Link href="/dashboard/albums" className="text-lg font-bold tracking-tight lowercase">
                    stillroom
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu className="w-5 h-5" />
                </Button>
            </header>

            {/* Mobile off-canvas drawer */}
            {drawerOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm animate-in fade-in"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-background shadow-xl flex flex-col px-3 py-6 animate-in slide-in-from-left duration-200">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-3"
                            onClick={() => setDrawerOpen(false)}
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                        {sidebarContent}
                    </div>
                </div>
            )}

            {/* Edit dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit album</DialogTitle>
                        <DialogDescription>Update the album details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="album-title">Album name</Label>
                            <Input
                                id="album-title"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="album-description">Description (optional)</Label>
                            <Input
                                id="album-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete album</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete
                            {albumToDelete ? ` “${albumToDelete.title}”` : ' this album'}?
                            This action cannot be undone and will delete all photos within the album.
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
        </>
    );
}

function SidebarNavItem({
    href,
    icon,
    label,
    active,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={cn(
                'flex items-center gap-2.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                active
                    ? 'bg-card font-medium'
                    : 'text-foreground/80 hover:bg-card/60'
            )}
        >
            <span className="text-muted-foreground">{icon}</span>
            {label}
        </Link>
    );
}
