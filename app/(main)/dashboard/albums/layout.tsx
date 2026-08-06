import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getAlbumsForUser, type AlbumSummary } from '@/lib/albums';
import { AlbumSidebar } from '@/components/album-sidebar';

export const runtime = 'nodejs'; // Payload
export const dynamic = 'force-dynamic';

export default async function AlbumsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    if (!userId) redirect('/');

    let albums: AlbumSummary[] = [];
    let displayName: string | null = null;
    try {
        const data = await getAlbumsForUser(userId);
        albums = data.albums;
        displayName = data.photographer?.display_name || data.photographer?.username || null;
    } catch (e) {
        console.error('Failed to fetch albums for sidebar', e);
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AlbumSidebar albums={albums} displayName={displayName} />
            {/* pt-14 clears the fixed mobile top bar rendered by the sidebar */}
            <main className="flex-1 min-w-0 pt-14 md:pt-0">
                {children}
            </main>
        </div>
    );
}
