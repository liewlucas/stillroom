import { createDirectus, rest, staticToken } from '@directus/sdk';

export interface Photographer {
    id: string; // uuid
    clerk_user_id: string;
    username: string;
    display_name: string;
    created_at: string;
}

export interface Project {
    id: string; // uuid
    photographer_id: string; // FK -> photographers.id
    slug: string;
    title: string;
    is_public: boolean;
    created_at: string;
}

export interface Photo {
    id: string; // uuid
    project_id: string; // FK -> projects.id
    r2_key: string;
    width: number;
    height: number;
    file_size: number;
    created_at: string;
}

export interface ShareLink {
    id: string; // uuid
    project_id: string; // FK -> projects.id
    token: string;
    expires_at: string | null;
    download_limit: number | null;
}

export interface DownloadEvent {
    id: string;
    photo_id: string;
    share_link_id: string;
    downloaded_at: string;
}

interface Schema {
    photographers: Photographer[];
    projects: Project[];
    photos: Photo[];
    share_links: ShareLink[];
    download_events: DownloadEvent[];
}

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const directusToken = process.env.DIRECTUS_STATIC_TOKEN;

// Public client
export const directus = createDirectus<Schema>(directusUrl).with(rest());

// Admin / Authenticated client (use with caution on server side)
export const getAdminDirectus = () => {
    if (!directusToken) {
        console.warn('DIRECTUS_STATIC_TOKEN is not set, using public client fallback which may fail for writes');
        return directus;
    }
    return createDirectus<Schema>(directusUrl).with(rest()).with(staticToken(directusToken));
};
