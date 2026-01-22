'use client';

import { useState, useEffect } from 'react';

export function Photo({ photoId, token }: { photoId: string, token?: string }) {
    const [src, setSrc] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

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
        return <div style={{ width: '100%', height: '100%', minHeight: '200px', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    return (
        <>
            <img
                src={src}
                loading="lazy"
                alt="Gallery photo"
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                onClick={() => setIsOpen(true)}
            />

            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }} onClick={() => setIsOpen(false)}>
                    <img src={src} style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} />
                    <button style={{
                        position: 'absolute',
                        top: '2rem',
                        right: '2rem',
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '2rem',
                        cursor: 'pointer'
                    }}>×</button>
                </div>
            )}
        </>
    );
}
