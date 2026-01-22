import { auth } from '@clerk/nextjs/server';
import { getAdminDirectus } from '@/lib/directus';
import { readItem, readItems } from '@directus/sdk';
import { notFound, redirect } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { UploadDropzone } from '@/components/upload-dropzone';
import { ShareGenerator } from '@/components/share-generator';
import { Photo } from '@/components/photo';
import Link from 'next/link';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const client = getAdminDirectus();

    // 1. Fetch Project
    let project;
    try {
        project = await client.request(readItem('projects', projectId));
    } catch (e) {
        notFound();
    }

    // 2. Authorization (Ensure owner)
    const photographers = await client.request(readItems('photographers', {
        filter: { clerk_user_id: { _eq: userId } }
    }));

    if (!photographers || photographers.length === 0 || photographers[0].id !== project.photographer_id) {
        // In real app, show 403
        return (
            <main>
                <Navigation />
                <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
                    Unauthorized
                </div>
            </main>
        );
    }

    // 3. Fetch Photos
    const photos = await client.request(readItems('photos', {
        filter: { project_id: { _eq: projectId } },
        sort: ['created_at']
    }));

    return (
        <main>
            <Navigation />
            <div className="container" style={{ paddingTop: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/dashboard/projects" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>← Back to Projects</Link>
                    <h1 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{project.title}</h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                    <div>
                        <UploadDropzone projectId={projectId} />

                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {photos.map((photo) => (
                                <div key={photo.id} style={{
                                    aspectRatio: '1/1',
                                    backgroundColor: 'var(--muted)',
                                    borderRadius: 'var(--radius)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    <Photo photoId={photo.id} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside>
                        <ShareGenerator projectId={projectId} />

                        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                            <h3>Project Settings</h3>
                            <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                                <div>Visibility: {project.is_public ? 'Public' : 'Private'}</div>
                                <div>Photos: {photos.length}</div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
