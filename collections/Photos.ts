import { CollectionConfig } from 'payload';

export const Photos: CollectionConfig = {
    slug: 'photos',
    fields: [
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
        },
        {
            name: 'r2_key',
            type: 'text',
            required: true,
        },
        {
            name: 'width',
            type: 'number',
        },
        {
            name: 'height',
            type: 'number',
        },
        {
            name: 'file_size',
            type: 'number',
        },
    ],
};
