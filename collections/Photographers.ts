import { CollectionConfig } from 'payload';

export const Photographers: CollectionConfig = {
    slug: 'photographers',
    admin: {
        useAsTitle: 'username',
    },
    auth: true, // Payload needs at least one auth collection enabled for Admin UI login
    fields: [
        {
            name: 'username',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'clerk_user_id',
            type: 'text',
            unique: true,
            // We might keep this for syncing, but if Payload handles auth, 
            // do we switch to Payload Auth entirely? 
            // User requirement: "Auth: Clerk".
            // So we Login via Clerk, and maybe we don't access Payload Admin Panel via Clerk easily? 
            // Or we trust Clerk for the frontend and Payload for the backend.
            // For this migration, I will allow simple email/password for the Payload Admin (Developer/Owner)
            // and use 'clerk_user_id' to map Frontend users to "Photographer" records.
            // Actually, 'auth: true' adds email/password fields automatically.
        },
        {
            name: 'display_name',
            type: 'text',
        },
    ],
};
