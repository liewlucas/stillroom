'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link as LinkIcon, Copy, Check, Trash2, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ShareLink {
    id: string;
    token: string;
    slug?: string | null;
    expires_at?: string | null;
}

interface ShareGeneratorProps {
    galleryId: string;
    username: string;
    initialLinks?: ShareLink[];
}

export function ShareGenerator({ galleryId, username, initialLinks = [] }: ShareGeneratorProps) {
    const [links, setLinks] = useState<ShareLink[]>(initialLinks);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState('');
    const [customSlug, setCustomSlug] = useState('');
    const [slugError, setSlugError] = useState('');
    const [showForm, setShowForm] = useState(links.length === 0);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

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
                body: JSON.stringify({ galleryId, expiresAt: expiresAt || undefined, customSlug: customSlug || undefined }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) setSlugError(data.error);
                else toast.error(data.error || 'Failed to create link');
                return;
            }
            setLinks((prev) => [data, ...prev]);
            setExpiresAt('');
            setCustomSlug('');
            setShowForm(false);
            toast.success('Share link created');
        } catch {
            toast.error('Failed to create link');
        } finally {
            setLoading(false);
        }
    };

    const deleteLink = async (id: string) => {
        try {
            const res = await fetch(`/api/share/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete link');
                return;
            }
            setLinks((prev) => prev.filter((l) => l.id !== id));
            toast.success('Link deleted');
        } catch {
            toast.error('Failed to delete link');
        }
    };

    const linkName = (link: ShareLink) => link.slug || link.token;

    const copyLink = (link: ShareLink) => {
        navigator.clipboard.writeText(`${origin}/${username}/share/${linkName(link)}`);
        setCopiedId(link.id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const isExpired = (expires_at?: string | null) =>
        expires_at ? new Date(expires_at) < new Date() : false;

    return (
        <div className="p-4 border rounded-lg bg-card shadow-sm space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Share Links
                </h3>
                {!showForm && (
                    <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                        <Plus className="w-3 h-3 mr-1" /> New
                    </Button>
                )}
            </div>

            {/* Existing links */}
            {links.length > 0 && (
                <ul className="space-y-2">
                    {links.map((link) => (
                        <li key={link.id} className="flex flex-col gap-1 p-2 bg-muted/50 rounded-md border text-xs">
                            <div className="flex items-center gap-2">
                                <span className="flex-1 font-mono truncate text-muted-foreground">
                                    /{username}/share/{linkName(link)}
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => copyLink(link)}
                                >
                                        {copiedId === link.id
                                        ? <Check className="w-3 h-3" />
                                        : <Copy className="w-3 h-3" />}
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                                    onClick={() => deleteLink(link.id)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                            {link.expires_at && (
                                <div className={`flex items-center gap-1 ${isExpired(link.expires_at) ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    <Clock className="w-3 h-3" />
                                    {isExpired(link.expires_at) ? 'Expired · ' : 'Expires · '}
                                    {new Date(link.expires_at).toLocaleDateString()}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* Create form */}
            {showForm && (
                <div className="space-y-2 pt-1">
                    <div>
                        <div className="flex items-center rounded-md border bg-muted/50 h-8 text-xs overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                            <span className="px-2 text-muted-foreground whitespace-nowrap shrink-0">/{username}/share/</span>
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
                        {slugError && <p className="text-xs text-destructive mt-1">{slugError}</p>}
                        {!slugError && <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate</p>}
                    </div>
                    <Input
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="h-8 text-xs"
                        min={new Date().toISOString().split('T')[0]}
                        placeholder="Expiry date (optional)"
                    />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={createLink} disabled={loading} className="flex-1">
                            {loading ? 'Generating...' : 'Create Link'}
                        </Button>
                        {links.length > 0 && (
                            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setCustomSlug(''); setSlugError(''); }}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {links.length === 0 && !showForm && (
                <p className="text-xs text-muted-foreground">No share links yet.</p>
            )}
        </div>
    );
}
