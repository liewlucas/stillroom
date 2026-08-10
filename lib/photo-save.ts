'use client';

import type { PhotoVariant } from '@/lib/photo-variants';

/**
 * Saving photos to a phone's camera roll from the web.
 *
 * There is no cross-platform API for this, so there are three transports and a
 * capability probe that picks between them:
 *
 *  - iOS  → the native share sheet (`navigator.share` with files). It is the only
 *           route into the Photos app; a plain download lands in Files instead.
 *  - Android → a plain download. It lands in /Download, which Google Photos and
 *           every gallery app surface under "Device folders" — no sheet, no extra
 *           tap. Sharing on Android would offer to *upload* to Google Photos.
 *  - Desktop → a plain download for one photo, the existing zip for many.
 */

/**
 * iOS holds every shared file in memory at once, and full-resolution JPEGs will
 * crash the tab well before this becomes a UX problem. Selections larger than
 * this are steered to the zip instead of being silently truncated.
 */
export const MAX_SHARE_FILES = 10;

/** Chrome on Android asks once to allow multiple downloads, then permits the rest. */
export const MAX_SEQUENTIAL_DOWNLOADS = 30;

/** Firing anchors back-to-back gets them dropped; this spacing survives. */
const DOWNLOAD_STAGGER_MS = 400;

export type SaveStrategy = 'share' | 'download' | 'zip';

export type PhotoUrlResponse = {
    url: string;
    filename: string;
    contentType: string;
    variant: PhotoVariant;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function isIOS() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    // iPadOS reports itself as a Mac, so touch points are the only tell.
    const iPadAsMac = ua.includes('Macintosh') && navigator.maxTouchPoints > 1;
    return /iPad|iPhone|iPod/.test(ua) || iPadAsMac;
}

export function isAndroid() {
    if (typeof navigator === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
}

/**
 * Share links get opened from inside Instagram, WhatsApp and Messenger far more
 * often than in a real browser, and those embedded webviews frequently support
 * neither the share sheet nor downloads — failing with no error at all. Detected
 * so the UI can say "open in Safari" instead of offering a dead button.
 */
export function isInAppBrowser() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|WeChat|Snapchat|TikTok|LinkedInApp|Twitter/i.test(ua);
}

/**
 * Whether this browser can put image files into the native share sheet.
 *
 * `'share' in navigator` is a false positive — plenty of browsers expose share()
 * without file support. `canShare` is synchronous and opens nothing, so probing
 * with a throwaway file is free and can run before any bytes are fetched.
 */
export function canShareImageFiles() {
    if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
    try {
        const probe = new File([new Uint8Array(1)], 'probe.jpg', { type: 'image/jpeg' });
        return navigator.canShare({ files: [probe] });
    } catch {
        return false;
    }
}

export function getSaveStrategy(count: number): SaveStrategy {
    if (isIOS() && canShareImageFiles()) return 'share';
    if (isAndroid()) return 'download';
    return count > 1 ? 'zip' : 'download';
}

/** Ask our own API to presign this photo. `disposition` makes R2 serve it as a named download. */
export async function getPhotoUrl(
    photoId: string,
    { token, variant = 'high', disposition }: { token?: string; variant?: PhotoVariant; disposition?: 'attachment' } = {},
): Promise<PhotoUrlResponse> {
    const params = new URLSearchParams({ variant });
    if (token) params.set('token', token);
    if (disposition) params.set('disposition', disposition);

    const res = await fetch(`/api/photos/${photoId}/download?${params.toString()}`);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not prepare that photo');
    }
    return res.json();
}

/**
 * Pull the actual bytes down so they can be handed to the share sheet.
 *
 * This is the one path that needs R2 CORS to allow GET from this origin — see
 * r2-cors.json. If that list falls out of date, iOS saving breaks while Android
 * keeps working, so failures here are surfaced rather than swallowed.
 */
export async function fetchPhotoFile(photoId: string, token?: string, signal?: AbortSignal): Promise<File> {
    const meta = await getPhotoUrl(photoId, { token, variant: 'high' });
    const res = await fetch(meta.url, { signal });
    if (!res.ok) throw new Error('Could not load that photo');
    const blob = await res.blob();
    // The filename extension and MIME type are load-bearing: without them iOS
    // drops "Save Image" from the sheet entirely.
    return new File([blob], meta.filename, { type: meta.contentType || blob.type || 'image/jpeg' });
}

export class ShareCancelled extends Error {}
export class ShareNeedsGesture extends Error {}

/**
 * Hand files to the native share sheet.
 *
 * Must be called from within the tap that triggered it — iOS discards the user
 * activation across a slow `await`, which is why callers fetch the bytes first
 * and only then call this.
 */
export async function sharePhotoFiles(files: File[], title?: string) {
    if (files.length === 0) return;
    if (!navigator.canShare?.({ files })) {
        throw new Error('This browser cannot save photos directly');
    }
    try {
        await navigator.share({ files, title });
    } catch (error) {
        const name = (error as Error)?.name;
        if (name === 'AbortError') throw new ShareCancelled();
        if (name === 'NotAllowedError') throw new ShareNeedsGesture();
        throw error;
    }
}

export function triggerDownload(url: string, filename?: string) {
    const a = document.createElement('a');
    a.href = url;
    // Ignored for cross-origin URLs — the Content-Disposition baked into the
    // presigned URL is what actually names the file. Set anyway for blob: URLs.
    if (filename) a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export async function downloadPhoto(photoId: string, token?: string) {
    const meta = await getPhotoUrl(photoId, { token, variant: 'high', disposition: 'attachment' });
    triggerDownload(meta.url, meta.filename);
}

export async function downloadPhotosSequentially(
    photoIds: string[],
    token?: string,
    onProgress?: (done: number, total: number) => void,
) {
    for (let i = 0; i < photoIds.length; i++) {
        await downloadPhoto(photoIds[i], token);
        onProgress?.(i + 1, photoIds.length);
        if (i < photoIds.length - 1) await delay(DOWNLOAD_STAGGER_MS);
    }
}

/** Fetch files for the share sheet with light concurrency, reporting progress. */
export async function fetchPhotoFiles(
    photoIds: string[],
    token?: string,
    onProgress?: (done: number, total: number) => void,
    concurrency = 3,
): Promise<File[]> {
    const files: (File | null)[] = new Array(photoIds.length).fill(null);
    let cursor = 0;
    let done = 0;

    const worker = async () => {
        while (cursor < photoIds.length) {
            const index = cursor++;
            files[index] = await fetchPhotoFile(photoIds[index], token);
            done++;
            onProgress?.(done, photoIds.length);
        }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, photoIds.length) }, worker));
    return files.filter((file): file is File => file !== null);
}
