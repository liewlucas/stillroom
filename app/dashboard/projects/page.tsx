import { auth } from '@clerk/nextjs/server';
import { Navigation } from '@/components/navigation';
import { getAdminDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';

export const runtime = 'edge';

// Ensure we don't cache this page so new projects appear immediately
export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const { userId } = await auth();
    if (!userId) return null;

    // Fetch projects for this user
    // In a real scenario, we would filter by photographer_id matching the clerk_user_id
    // For now, we'll try to fetch all projects and filter or assume user mapping logic exists
    // Detailed mapping logic will be implemented in the next step (User Sync)

    // NOTE: This will fail if DB is not set up, so wrapping in try/catch for initial scaffolding
    let projects: any[] = [];
    try {
        const client = getAdminDirectus();
        // We need to look up the photographer first
        const photographers = await client.request(readItems('photographers', {
            filter: {
                clerk_user_id: {
                    _eq: userId
                }
            }
        }));

        const photographer = photographers[0];

        if (photographer) {
            projects = await client.request(readItems('projects', {
                filter: {
                    photographer_id: {
                        _eq: photographer.id
                    }
                },
                sort: ['-created_at']
            }));
        }
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
