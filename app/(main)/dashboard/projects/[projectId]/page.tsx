import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';

import { ShareGenerator } from '@/components/share-generator';
import { Photo } from '@/components/photo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { ProjectUploader } from '@/components/project-uploader';
import { ProjectGallery } from '@/components/project-gallery';

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
    const photographers = await payload.find({
        collection: 'photographers',
        where: { clerk_user_id: { equals: userId } }
    });

    const ownerId = typeof project.photographer === 'object' ? project.photographer.id : project.photographer;

    if (!photographers.docs || photographers.docs.length === 0 || photographers.docs[0].id !== ownerId) {
        return (
            <main>
                <div className="w-full px-10 py-20 text-center">
                    <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
                    <p className="text-muted-foreground mt-2">You do not have permission to view this project.</p>
                    <Link href="/dashboard/projects" className="mt-4 inline-block">
                        <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                </div>
            </main>
        );
    }

    // 3. Fetch Photos
    const result = await payload.find({
        collection: 'photos',
        where: { project: { equals: projectId } },
        limit: 100,
        sort: '-createdAt'
    });
    const photos = result.docs;

    return (
        <main>
            <div className="w-full px-10 py-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Projects
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <ProjectUploader projectId={projectId} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                    {/* Gallery Grid */}
                    <div>
                        <ProjectGallery photos={photos} projectId={projectId} />
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        <ShareGenerator projectId={projectId} />

                        <div className="p-4 border rounded-lg bg-card shadow-sm">
                            <div className="flex items-center text-sm font-medium mb-3">
                                <Settings className="w-4 h-4 mr-2" /> Project Details
                            </div>
                            <dl className="text-sm space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <dt className="text-muted-foreground">Photos</dt>
                                    <dd className="font-medium">{photos.length}</dd>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <dt className="text-muted-foreground">Visibility</dt>
                                    <dd className="font-medium">{project.is_public ? 'Public' : 'Private'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Created</dt>
                                    <dd className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</dd>
                                </div>
                            </dl>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
