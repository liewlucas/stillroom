import { getPayloadClient } from '@/lib/data';
import { currentUser } from '@clerk/nextjs/server';

export async function ensurePhotographer() {
    const user = await currentUser();
    if (!user) throw new Error('Not authenticated');

    const payload = await getPayloadClient();

    // Check if photographer exists
    const existing = await payload.find({
        collection: 'photographers',
        where: {
            clerk_user_id: {
                equals: user.id
            }
        }
    });

    if (existing.docs.length > 0) {
        return existing.docs[0];
    }

    // Create photographer
    const newPhotographer = await payload.create({
        collection: 'photographers',
        data: {
            clerk_user_id: user.id,
            username: user.username || user.id,
            display_name: `${user.firstName} ${user.lastName}`.trim() || user.username || 'Photographer',
            password: 'placeholder_password_since_we_use_clerk', // Payload Auth enabled requires password usually? Maybe not if we disable admin access for them? Detailed config needed.
            email: user.emailAddresses[0]?.emailAddress || `${user.id}@example.com`,
        }
    });

    return newPhotographer;
}
