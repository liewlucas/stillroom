import { getAdminDirectus } from '@/lib/directus';
import { createItem, readItems } from '@directus/sdk';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function ensurePhotographer() {
    const user = await currentUser();
    if (!user) throw new Error('Not authenticated');

    const client = getAdminDirectus();

    // Check if photographer exists
    const existing = await client.request(readItems('photographers', {
        filter: {
            clerk_user_id: {
                _eq: user.id
            }
        }
    }));

    if (existing && existing.length > 0) {
        return existing[0];
    }

    // Create photographer
    const newPhotographer = await client.request(createItem('photographers', {
        clerk_user_id: user.id,
        username: user.username || user.id,
        display_name: `${user.firstName} ${user.lastName}`.trim() || user.username || 'Photographer',
    }));

    return newPhotographer;
}
