'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';


interface ProjectLightboxProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photos: any[];
    initialIndex: number;
    onClose: () => void;
}

export function ProjectLightbox({ photos, initialIndex, onClose }: ProjectLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const activePhoto = photos[currentIndex];

    // Fetch URL for the current photo
    useEffect(() => {
        if (!activePhoto) return;

        // If we were passing URLs directly we wouldn't need this, but we are fetching on demand
        // to keep logic consistent with the Photo component and ensure fresh signatures.
        let isMounted = true;
        setLoading(true);
        setCurrentUrl(null);

        const fetchUrl = async () => {
            try {
                const res = await fetch(`/api/photos/${activePhoto.id}/download`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setCurrentUrl(data.url);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchUrl();
        return () => { isMounted = false; };
    }, [activePhoto]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, [photos.length]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }, [photos.length]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handleNext, handlePrev]);

    if (!activePhoto) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
            {/* Close Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-50"
                onClick={onClose}
            >
                <X className="w-6 h-6" />
            </Button>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 w-12 h-12 rounded-full"
                        onClick={handlePrev}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 w-12 h-12 rounded-full"
                        onClick={handleNext}
                    >
                        <ChevronRight className="w-8 h-8" />
                    </Button>
                </>
            )}

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/50 text-sm font-mono">
                {currentIndex + 1} / {photos.length}
            </div>

            {/* Content */}
            <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4 flex items-center justify-center">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
                    </div>
                )}
                {currentUrl && (
                    // Using standard img tag for flexibility with dynamic remote URLs or next/image with complex loader
                    // Since specific domains for R2 might vary or be huge, img tag is safest for this quick implementation
                    // unless we configured patterns.

                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={currentUrl}
                        alt={`Photo ${activePhoto.id}`}
                        className="max-w-full max-h-full object-contain drop-shadow-2xl"
                    />
                )}
            </div>
        </div>
    );
}
