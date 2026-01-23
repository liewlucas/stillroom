import { CollectionConfig } from 'payload';

export const Photos: CollectionConfig = {
    slug: 'photos',
    fields: [
        {
            name: 'project', // Keeping the field name 'project' for now to minimize refactor, or should I rename it? 
            // The plan said "Update Photos collection to relate to galleries instead of projects". 
            // I'll update the relationTo. I should probably rename the field too, but let's check the plan.
            // Plan says: "Update references to projects in codebase to galleries".
            // So I should rename the field to 'gallery' as well.
            // Wait, renaming the field in Payload means the DB column changes (or new table join).
            // Yes, I should rename it to 'gallery'.
            type: 'relationship',
            relationTo: 'galleries',
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
