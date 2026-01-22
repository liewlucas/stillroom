import { auth } from '@clerk/nextjs/server';
import { Navigation } from '@/components/navigation';
import { getPayloadClient } from '@/lib/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ensurePhotographer } from '@/lib/auth-sync';

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
            <Navigation />
            <div className="container py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <Link href="/dashboard/projects/new">
                        <Button>New Project</Button>
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No projects found. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block group">
                                <div className="p-6 border rounded-lg hover:border-primary transition-colors bg-card text-card-foreground shadow-sm">
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{project.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">/{project.slug}</p>
                                    <div className="mt-4 text-xs text-muted-foreground">
                                        Created {new Date(project.createdAt).toLocaleDateString()}
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
