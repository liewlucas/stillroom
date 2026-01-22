import { auth } from '@clerk/nextjs/server';
import { Navigation } from '@/components/navigation';
import { getPayloadClient } from '@/lib/data';
import Link from 'next/link';
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
            <div className="container" style={{ paddingTop: '2rem' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem' }}>Projects</h1>
                    <button className="button">New Project</button>
                </div>

                {projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--muted-foreground)' }}>
                        No projects found. Create one to get started.
                    </div>
                ) : (
                    <div className="grid">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/dashboard/projects/${project.id}`} style={{
                                display: 'block',
                                padding: '1rem',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)'
                            }}>
                                <div style={{ fontWeight: 'bold' }}>{project.title}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                    /{project.slug}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
