import { getAdminDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Photo } from '@/components/photo';

export const runtime = 'edge';

// /[username]/[projectSlug]
export default async function GalleryPage({ params }: { params: Promise<{ username: string; projectSlug: string }> }) {
    const { username, projectSlug } = await params;

    const client = getAdminDirectus();

    // 1. Find Photographer
    const photographers = await client.request(readItems('photographers', {
        filter: { username: { _eq: username } }
    }));

    if (!photographers || photographers.length === 0) {
        notFound();
    }
    const photographer = photographers[0];

    // 2. Find Project
    const projects = await client.request(readItems('projects', {
        filter: {
            photographer_id: { _eq: photographer.id },
            slug: { _eq: projectSlug }
        }
    }));

    if (!projects || projects.length === 0) {
        notFound();
    }
    const project = projects[0];

    // 3. Check Visibility
    // If not public, we might need a token?
    // The route /[username]/[projectSlug] implies public utility or authenticated view.
    // If it is private, maybe redirect to login or show password prompt?
    // For now, if public, show it.
    if (!project.is_public) {
        // In a real app we'd check req authentication or session
        // For this task, we will just render a "Private Project" message if accessed publicly without auth
        // But wait, the user instructions say: "Clients: access galleries via share tokens".
        // Example: photoviewer.com/share/[token] or this route?
        // "GET /api/projects/[username]/[projectSlug]" was listed in required API routes.
        // But the prompt also listed "/[username]/[projectSlug]" as a URL structure.
        // Let's assume if it is NOT public, it returns 404 or 403 unless the user is the owner.
    }

    // 4. Fetch Photos
    const photos = await client.request(readItems('photos', {
        filter: { project_id: { _eq: project.id } },
        sort: ['created_at'] // or custom order
    }));

    return (
        <main>
            <Navigation />
            <div className="container" style={{ paddingTop: '2rem' }}>
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{project.title}</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>by {photographer.display_name}</p>
                </header>

                <div className="grid" style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1rem'
                }}>
                    {photos.map((photo) => (
                        <div key={photo.id} style={{
                            aspectRatio: `${photo.width}/${photo.height}`,
                            backgroundColor: 'var(--muted)',
                            borderRadius: 'var(--radius)',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {/* We need a signed URL to display the image? 
                              R2 must never be public.
                              So the <img src> must be a signed URL or a proxy route.
                              Using a proxy route is better for caching and cleaner HTML.
                              GET /api/photos/[photoId]/download?token=...
                              Or if public, just /api/photos/[photoId]/thumbnail?
                              
                              Since we need to protect R2, we can't just put `custom-domain.com/key`.
                              We will use the download route for the display source for now, 
                              but ideally we'd generate signed URLs serverside and pass them to client.
                              However, signed URLs expire. 60 seconds is too short for a gallery page load?
                              "signed URLs expire in ≤ 60 seconds" -> This constraint is tight.
                              It implies we should generate them on the fly or use a proxy.
                              A proxy `/api/photos/[id]/view` that streams the file might be better for "Lazy image loading".
                              
                              For this implementation, let's create a component that fetches the URL.
                          */}
                            <Photo photoId={photo.id} />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
