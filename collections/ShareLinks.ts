import { CollectionConfig } from 'payload';

export const ShareLinks: CollectionConfig = {
    slug: 'share_links',
    fields: [
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
        },
        {
            name: 'token',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'expires_at',
            type: 'date',
        },
        {
            name: 'download_limit',
            type: 'number',
        },
    ],
};
