'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PhotoProps {
    photoId: string;
    token?: string;
    onClick?: () => void;
    className?: string; // Add className prop for flexibility
}

export function Photo({ photoId, token, onClick, className }: PhotoProps) {
    const [src, setSrc] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchUrl = async () => {
            try {
                const params = new URLSearchParams({ variant: 'web' });
                if (token) params.set('token', token);
                const query = `?${params.toString()}`;
                const res = await fetch(`/api/photos/${photoId}/download${query}`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setSrc(data.url);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchUrl();
        return () => { isMounted = false; };
    }, [photoId, token]);

    if (!src) {
        // Fill the parent tile so aspect-ratio containers keep their shape
        // while the presigned URL is fetched.
        return <div className="w-full h-full bg-muted animate-pulse" />;
    }

    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={src}
            loading="lazy"
            alt="Album photo"
            onLoad={() => setLoaded(true)}
            className={cn(
                className || 'w-full h-full object-cover block cursor-pointer',
                'transition-opacity duration-500',
                loaded ? 'opacity-100' : 'opacity-0'
            )}
            onClick={onClick}
        />
    );
}
