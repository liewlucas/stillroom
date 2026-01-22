import { auth } from '@clerk/nextjs/server';

import { getPayloadClient } from '@/lib/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ensurePhotographer } from '@/lib/auth-sync';
import { FolderOpen, Plus } from 'lucide-react';

export const runtime = 'nodejs'; // Payload

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const { userId } = await auth();
    if (!userId) return null;

    let projects: any[] = [];
    try {
        const photographer = await ensurePhotographer();
        const payload = await getPayloadClient();

        const result = await payload.find({
            collection: 'projects',
            where: {
                photographer: {
                    equals: photographer.id
                }
            },
            sort: '-createdAt'
        });
        projects = result.docs;

    } catch (e) {
        console.error('Failed to fetch projects', e);
    }

    return (
        <main>
            <div className="w-full px-10 py-10">
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                        <p className="text-muted-foreground mt-1">Manage your photo collections.</p>
                    </div>
                    <Link href="/dashboard/projects/new">
                        <Button className="shadow-sm">
                            <Plus className="w-4 h-4 mr-2" /> New Project
                        </Button>
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-card">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <FolderOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No projects yet</h3>
                        <p className="text-muted-foreground mb-4 max-w-xs mx-auto">
                            Create your first project to start delivering photos to clients.
                        </p>
                        <Link href="/dashboard/projects/new">
                            <Button>Create Project</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block group h-full">
                                <div className="h-full p-6 border rounded-xl bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/50 group-hover:-translate-y-0.5 relative overflow-hidden">
                                    {/* Box Hover Effect Highlight */}
                                    {/* <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" /> */}

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2 bg-primary/5 rounded-md">
                                            <FolderOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        {/* Status badge could go here */}
                                    </div>

                                    <h3 className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                                        {project.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 font-mono text-xs opacity-70 truncate">
                                        /{project.slug}
                                    </p>

                                    <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                        <span>View &rarr;</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
