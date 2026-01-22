import { CollectionConfig } from 'payload';

export const Projects: CollectionConfig = {
    slug: 'projects',
    admin: {
        useAsTitle: 'title',
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            index: true,
        },
        {
            name: 'photographer',
            type: 'relationship',
            relationTo: 'photographers',
            required: true,
        },
        {
            name: 'is_public',
            type: 'checkbox',
            defaultValue: false,
        },
    ],
};
