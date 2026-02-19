'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Photo } from '@/components/photo';
import { GalleryLightbox } from '@/components/gallery-lightbox';

interface PublicPhoto {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface PublicGalleryViewProps {
    gallery: { title: string; description?: string | null };
    photographer: { display_name?: string | null };
    photos: PublicPhoto[];
    token: string;
}

export function PublicGalleryView({ gallery, photographer, photos, token }: PublicGalleryViewProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="px-6 pt-12 pb-8 text-center max-w-2xl mx-auto w-full">
                {photographer.display_name && (
                    <div className="flex items-center justify-center gap-1.5 mb-5 text-muted-foreground">
                        <Camera className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium tracking-wide">{photographer.display_name}</span>
                    </div>
                )}
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{gallery.title}</h1>
                {gallery.description && (
                    <p className="text-muted-foreground text-base leading-relaxed">{gallery.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-4 uppercase tracking-widest">
                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </p>
            </header>

            {/* Divider */}
            <div className="w-12 h-px bg-border mx-auto mb-6" />

            {/* Photo Grid */}
            <div className="flex-1 px-1 pb-16">
                {photos.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>No photos in this gallery yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.id}
                                className="relative aspect-square bg-muted overflow-hidden cursor-pointer group"
                                onClick={() => setLightboxIndex(index)}
                            >
                                <Photo
                                    photoId={String(photo.id)}
                                    token={token}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="py-8 text-center border-t">
                <p className="text-xs text-muted-foreground">
                    Delivered by <span className="font-semibold text-foreground">Stillroom</span>
                </p>
            </footer>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <GalleryLightbox
                    photos={photos}
                    initialIndex={lightboxIndex}
                    token={token}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
}
