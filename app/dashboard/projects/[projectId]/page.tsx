import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { UploadDropzone } from '@/components/upload-dropzone';
import { ShareGenerator } from '@/components/share-generator';
import { Photo } from '@/components/photo';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const payload = await getPayloadClient();

    // 1. Fetch Project
    let project;
    try {
        project = await payload.findByID({ collection: 'projects', id: projectId });
    } catch (e) {
        notFound();
    }

    // 2. Authorization (Ensure owner)
    // Check against Clerk User
    const photographers = await payload.find({
        collection: 'photographers',
        where: { clerk_user_id: { equals: userId } }
    });

    const ownerId = typeof project.photographer === 'object' ? project.photographer.id : project.photographer;

    if (!photographers.docs || photographers.docs.length === 0 || photographers.docs[0].id !== ownerId) {
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
    const result = await payload.find({
        collection: 'photos',
        where: { project: { equals: projectId } },
        limit: 100,
    });
    const photos = result.docs;

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
                            {photos.map((photo) => {
                                const r2Key = typeof photo.r2_key === 'string' ? photo.r2_key : '';
                                const photoId = r2Key.split('/').pop()?.replace('.jpg', '') || String(photo.id);
                                // Using logic from Download route: it fetches by r2_key content.
                                // Ideally we pass the Payload ID if download route supports it.
                                // My download route logic: `where: { r2_key: { contains: photoId } }`.
                                // So passing strictly the UUID inside the key works. 

                                return (
                                    <div key={photo.id} style={{
                                        aspectRatio: '1/1',
                                        backgroundColor: 'var(--muted)',
                                        borderRadius: 'var(--radius)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        <Photo photoId={photoId} />
                                    </div>
                                );
                            })}
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
