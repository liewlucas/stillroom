'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
            // Authoritative Flow: Redirect to Upload page
            router.push(`/dashboard/projects/${data.id}/upload`);
        } catch (error) {
            console.error(error);
            alert('Error creating project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-md mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Project Name</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Summer Wedding"
                        required
                    />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Creating...' : 'Create Project'}
                </Button>
            </form>
        </div>
    );
}
