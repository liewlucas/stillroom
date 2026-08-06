'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewAlbumPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/galleries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });

            if (!res.ok) throw new Error('Failed to create album');

            const data = await res.json();
            toast.success('Album created');

            // Redirect into the new album; refresh so the sidebar picks it up.
            router.push(`/dashboard/albums/${data.id}`);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create album');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto px-6 py-16 md:py-24">
            <Card className="rounded-2xl shadow-sm border-border/60">
                <CardHeader>
                    <CardTitle className="text-2xl tracking-tight">New album</CardTitle>
                    <CardDescription>Create a dedicated space for your photos.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Album name</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Sarah & Tom — Wedding"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief description of this album"
                                disabled={loading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Link href="/dashboard/albums">
                            <Button variant="ghost" type="button" disabled={loading} className="rounded-full px-5">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={loading || !title.trim()} className="rounded-full px-5">
                            {loading ? 'Creating...' : 'Create album'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
