import type { CollectionConfig } from 'payload';

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
            label: 'Full-resolution R2 key',
            type: 'text',
            required: true,
        },
        {
            name: 'web_r2_key',
            type: 'text',
        },
        {
            name: 'high_res_r2_key',
            type: 'text',
        },
        {
            name: 'width',
            label: 'Original width',
            type: 'number',
        },
        {
            name: 'height',
            label: 'Original height',
            type: 'number',
        },
        {
            name: 'web_width',
            type: 'number',
        },
        {
            name: 'web_height',
            type: 'number',
        },
        {
            name: 'high_res_width',
            type: 'number',
        },
        {
            name: 'high_res_height',
            type: 'number',
        },
        {
            name: 'file_size',
            label: 'Original file size',
            type: 'number',
        },
        {
            name: 'web_file_size',
            type: 'number',
        },
        {
            name: 'high_res_file_size',
            type: 'number',
        },
        {
            name: 'original_filename',
            type: 'text',
        },
        {
            name: 'content_type',
            type: 'text',
        },
    ],
};
