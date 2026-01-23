'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });

            if (!res.ok) throw new Error('Failed to create project');

            const data = await res.json();
            toast.success('Project created successfully');

            // Redirect to Project Dashboard
            router.push(`/dashboard/projects/${data.id}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-lg mx-auto py-20">
            <Card>
                <CardHeader>
                    <CardTitle>New Project</CardTitle>
                    <CardDescription>Create a dedicated space for your photo collection.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Project Name</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Architecture Shout"
                                required
                                disabled={loading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Link href="/dashboard/projects">
                            <Button variant="ghost" type="button" disabled={loading}>
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={loading || !title.trim()}>
                            {loading ? 'Creating...' : 'Create Project'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
