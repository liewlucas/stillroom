export type PhotoVariant = 'web' | 'high' | 'full';

type PhotoWithVariantKeys = {
    [key: string]: unknown;
    r2_key?: string | null;
    web_r2_key?: string | null;
    high_res_r2_key?: string | null;
};

export function getPhotoR2Key(photo: PhotoWithVariantKeys, variant: PhotoVariant = 'high') {
    if (variant === 'web') return photo.web_r2_key;
    if (variant === 'full') return photo.r2_key;
    return photo.high_res_r2_key;
}

export function getAllPhotoR2Keys(photo: PhotoWithVariantKeys) {
    return Array.from(new Set([
        photo.r2_key,
        photo.web_r2_key,
        photo.high_res_r2_key,
    ].filter((key): key is string => Boolean(key))));
}

export function getPhotoStoragePrefix(fullKey: string) {
    const lastSlash = fullKey.lastIndexOf('/');
    if (lastSlash === -1) return '';
    return fullKey.slice(0, lastSlash);
}
