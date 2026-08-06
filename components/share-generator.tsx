'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Trash2, Clock, LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface ShareLink {
    id: string;
    token: string;
    slug?: string | null;
    expires_at?: string | null;
}

export const isLinkExpired = (expires_at?: string | null) =>
    expires_at ? new Date(expires_at) < new Date() : false;

const linkName = (link: ShareLink) => link.slug || link.token;

/**
 * The list and the creator are separate surfaces (two dialogs in the album
 * header), so `links` is owned by the parent — otherwise creating a link in
 * one dialog wouldn't show up in the other.
 */

interface ShareLinkListProps {
    links: ShareLink[];
    username: string;
    onDeleted: (id: string) => void;
    /** Lets the empty state hand off to the create dialog. */
    onCreateNew?: () => void;
}

export function ShareLinkList({ links, username, onDeleted, onCreateNew }: ShareLinkListProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const copyLink = (link: ShareLink) => {
        navigator.clipboard.writeText(`${origin}/${username}/share/${linkName(link)}`);
        setCopiedId(link.id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const deleteLink = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/share/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to delete link');
                return;
            }
            onDeleted(id);
            toast.success('Link deleted');
        } catch {
            toast.error('Failed to delete link');
        } finally {
            setDeletingId(null);
        }
    };

    if (links.length === 0) {
        return (
            <div className="py-8 text-center">
                <div className="mx-auto w-11 h-11 rounded-full bg-muted flex items-center justify-center mb-3">
                    <LinkIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No shared links yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Create a link to let anyone view and download this album.
                </p>
                {onCreateNew && (
                    <Button size="sm" className="mt-4 rounded-full px-5" onClick={onCreateNew}>
                        Create a link
                    </Button>
                )}
            </div>
        );
    }

    return (
        <ul className="space-y-2 max-h-[55vh] overflow-y-auto">
            {links.map((link) => {
                const expired = isLinkExpired(link.expires_at);
                return (
                    <li
                        key={link.id}
                        className="flex flex-col gap-1 p-2.5 bg-muted/50 rounded-lg border text-xs"
                    >
                        <div className="flex items-center gap-2">
                            <span className="flex-1 font-mono truncate text-muted-foreground">
                                /{username}/share/{linkName(link)}
                            </span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0"
                                onClick={() => copyLink(link)}
                                aria-label="Copy link"
                            >
                                {copiedId === link.id
                                    ? <Check className="w-3.5 h-3.5" />
                                    : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => deleteLink(link.id)}
                                disabled={deletingId === link.id}
                                aria-label="Delete link"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        {link.expires_at && (
                            <div className={`flex items-center gap-1 ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
                                <Clock className="w-3 h-3" />
                                {expired ? 'Expired · ' : 'Expires · '}
                                {new Date(link.expires_at).toLocaleDateString()}
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

interface ShareLinkCreatorProps {
    galleryId: string; // JSON body key expected by /api/share — do not rename
    username: string;
    onCreated: (link: ShareLink) => void;
}

export function ShareLinkCreator({ galleryId, username, onCreated }: ShareLinkCreatorProps) {
    const [loading, setLoading] = useState(false);
    const [expiresAt, setExpiresAt] = useState('');
    const [customSlug, setCustomSlug] = useState('');
    const [slugError, setSlugError] = useState('');

    const createLink = async () => {
        setSlugError('');
        if (customSlug && !/^[a-z0-9-]+$/.test(customSlug)) {
            setSlugError('Only lowercase letters, numbers, and hyphens');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    galleryId,
                    expiresAt: expiresAt || undefined,
                    customSlug: customSlug || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                // 409 is a slug collision — keep it inline next to the field
                // rather than in a toast, so the user can just edit and retry.
                if (res.status === 409) setSlugError(data.error);
                else toast.error(data.error || 'Failed to create link');
                return;
            }
            setExpiresAt('');
            setCustomSlug('');
            toast.success('Share link created');
            onCreated(data);
        } catch {
            toast.error('Failed to create link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-medium mb-1.5 block">Link name</label>
                <div className="flex items-center rounded-md border bg-muted/50 h-9 text-xs overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                    <span className="px-2 text-muted-foreground whitespace-nowrap shrink-0">
                        /{username}/share/
                    </span>
                    <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => {
                            setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                            setSlugError('');
                        }}
                        placeholder="custom-name (optional)"
                        className="flex-1 bg-transparent outline-none pr-2 min-w-0"
                    />
                </div>
                {slugError
                    ? <p className="text-xs text-destructive mt-1">{slugError}</p>
                    : <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate</p>}
            </div>

            <div>
                <label className="text-xs font-medium mb-1.5 block">Expiry date (optional)</label>
                <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-9 text-xs"
                    min={new Date().toISOString().split('T')[0]}
                />
            </div>

            <Button onClick={createLink} disabled={loading} className="w-full rounded-full">
                {loading ? 'Generating...' : 'Create link'}
            </Button>
        </div>
    );
}
