import { CollectionConfig } from 'payload';

export const Galleries: CollectionConfig = {
    slug: 'galleries',
    labels: {
        singular: 'Gallery',
        plural: 'Galleries',
    },
    admin: {
        useAsTitle: 'title',
    },
    fields: [
        {
            name: 'title',
            label: 'Name',
            type: 'text',
            required: true,
        },
        {
            name: 'description',
            label: 'Description',
            type: 'text',
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
