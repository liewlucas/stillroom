'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function ShareGenerator({ projectId }: { projectId: string }) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateLink = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            const data = await res.json();
            if (data.token) {
                setToken(data.token);
                toast.success('Share link created!');
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to create link');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!token) return;
        const url = `${window.location.origin}/share/${token}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 border rounded-lg bg-card shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Share Project
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Generate a secure link for clients</p>
                </div>
                {!token && (
                    <Button onClick={generateLink} disabled={loading} size="sm">
                        {loading ? 'Generating...' : 'Create Link'}
                    </Button>
                )}
            </div>

            {token && (
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 p-2 bg-muted rounded-md border text-xs font-mono truncate">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/share/{token}
                    </div>
                    <Button onClick={copyToClipboard} size="icon" variant="outline" className="h-8 w-8">
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                </div>
            )}
        </div>
    );
}
