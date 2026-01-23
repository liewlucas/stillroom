import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@clerk/nextjs/server';
import { getPayloadClient } from '@/lib/data';


// Authoritative Spec: Flow 1 - Create New Project
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        // console.log('[API/galleries] Request from user:', userId);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description } = body;

        if (!title || typeof title !== 'string') {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const payload = await getPayloadClient();

        // 1. Resolve photographer by Clerk ID (Authoritative)
        let photographer;
        try {
            const result = await payload.find({
                collection: 'photographers',
                where: {
                    clerk_user_id: { equals: userId }
                }
            });
            if (result.docs.length > 0) {
                photographer = result.docs[0];
            } else {
                // Fallback: Just-in-time creation if not found (Consistency)
                console.log('[API/galleries] Photographer not found, creating...');
                const user = await import('@clerk/nextjs/server').then(mod => mod.currentUser());
                if (!user) throw new Error('User not found'); // Should not happen if auth() passed

                photographer = await payload.create({
                    collection: 'photographers',
                    data: {
                        clerk_user_id: userId,
                        username: user.username || userId,
                        display_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Photographer',
                        email: user.emailAddresses[0]?.emailAddress || `${userId}@example.com`,
                        password: crypto.randomBytes(16).toString('hex') // Dummy password
                    }
                });
            }
        } catch (e) {
            console.error('[API/galleries] Error resolving photographer:', e);
            return NextResponse.json({ error: 'Failed to resolve photographer identity' }, { status: 500 });
        }

        // 2. Generate Slug
        const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const uniqueSuffix = Date.now().toString().slice(-4);
        const slug = `${baseSlug}-${uniqueSuffix}`;

        // 3. Create Gallery
        const gallery = await payload.create({
            collection: 'galleries',
            data: {
                title,
                description,
                slug,
                photographer: photographer.id,
                is_public: false,
            }
        });

        console.log('[API/galleries] Created gallery:', gallery.id);

        return NextResponse.json({
            id: gallery.id,
            slug: gallery.slug
        });

    } catch (error) {
        console.error('[API/galleries] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
