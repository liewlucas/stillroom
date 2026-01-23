'use client';

import { useState, useEffect } from 'react';

interface PhotoProps {
    photoId: string;
    token?: string;
    onClick?: () => void;
    className?: string; // Add className prop for flexibility
}

export function Photo({ photoId, token, onClick, className }: PhotoProps) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchUrl = async () => {
            try {
                const query = token ? `?token=${token}` : '';
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
        return <div className="w-full h-full min-h-[200px] bg-muted flex items-center justify-center animate-pulse"></div>;
    }

    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={src}
            loading="lazy"
            alt="Gallery photo"
            className={className || "w-full h-full object-cover block cursor-pointer"}
            onClick={onClick}
        />
    );
}
