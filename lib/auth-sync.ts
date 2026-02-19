import { getPayloadClient } from '@/lib/data';
import { currentUser } from '@clerk/nextjs/server';

export async function ensurePhotographer(userId: string) {
    const payload = await getPayloadClient();

    const existing = await payload.find({
        collection: 'photographers',
        where: { clerk_user_id: { equals: userId } },
    });

    if (existing.docs.length > 0) {
        return existing.docs[0];
    }

    // Only call currentUser() when we actually need to create a new record
    const user = await currentUser();
    if (!user) throw new Error('Not authenticated');

    const newPhotographer = await payload.create({
        collection: 'photographers',
        data: {
            clerk_user_id: user.id,
            username: user.username || user.id,
            display_name: `${user.firstName} ${user.lastName}`.trim() || user.username || 'Photographer',
            password: 'placeholder_password_since_we_use_clerk',
            email: user.emailAddresses[0]?.emailAddress || `${user.id}@example.com`,
        },
    });

    return newPhotographer;
}
