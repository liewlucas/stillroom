'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { PhotoVariant } from '@/lib/photo-variants';
import {
    ShareCancelled,
    ShareNeedsGesture,
    downloadPhoto,
    fetchPhotoFile,
    getPhotoUrl,
    getSaveStrategy,
    sharePhotoFiles,
} from '@/lib/photo-save';

interface PhotoLightboxProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photos: any[];
    initialIndex: number;
    onClose: () => void;
    token?: string;
    /** Which rendition to display. Saving always uses the high-res variant. */
    variant?: PhotoVariant;
    allowSave?: boolean;
}

/** How many slides either side of the current one get their image loaded. */
const PRELOAD_RADIUS = 2;

function LightboxSlide({
    photoId,
    token,
    variant,
    load,
}: {
    photoId: string;
    token?: string;
    variant: PhotoVariant;
    load: boolean;
}) {
    const [url, setUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!load || url) return;
        let mounted = true;
        getPhotoUrl(photoId, { token, variant })
            .then((meta) => { if (mounted) setUrl(meta.url); })
            .catch(() => { if (mounted) setFailed(true); });
        return () => { mounted = false; };
    }, [load, url, photoId, token, variant]);

    return (
        <div className="relative w-full h-full shrink-0 grow-0 basis-full snap-center flex items-center justify-center p-3 sm:p-6">
            {!url && !failed && load && (
                <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
            )}
            {failed && (
                <p className="text-white/50 text-sm">Could not load this photo</p>
            )}
            {url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={url}
                    alt=""
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-full max-h-full object-contain drop-shadow-2xl select-none"
                />
            )}
        </div>
    );
}

export function PhotoLightbox({
    photos,
    initialIndex,
    onClose,
    token,
    variant = 'web',
    allowSave = true,
}: PhotoLightboxProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [saving, setSaving] = useState(false);

    // Resolved once on mount: the transport that can actually reach this device's
    // photo library. 'share' means the native sheet, which needs the file bytes
    // in hand *before* the tap, so the current photo is prefetched below.
    const strategy = useMemo(() => (allowSave ? getSaveStrategy(1) : null), [allowSave]);
    const [readyFile, setReadyFile] = useState<{ index: number; file: File } | null>(null);

    const currentPhoto = photos[currentIndex];
    const currentId = currentPhoto ? String(currentPhoto.id) : null;

    // Lock the page behind the overlay. Plain `overflow: hidden` is not enough on
    // iOS Safari — without pinning the body, the page scrolls under your finger
    // while you are trying to swipe between photos.
    useEffect(() => {
        const { body } = document;
        const scrollY = window.scrollY;
        const previous = {
            position: body.style.position,
            top: body.style.top,
            left: body.style.left,
            right: body.style.right,
            width: body.style.width,
            overflow: body.style.overflow,
        };

        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
        body.style.overflow = 'hidden';

        return () => {
            Object.assign(body.style, previous);
            window.scrollTo(0, scrollY);
        };
    }, []);

    // Jump to the opened photo without animating past everything in between.
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollTo({ left: track.clientWidth * initialIndex, behavior: 'instant' as ScrollBehavior });
    }, [initialIndex]);

    // The scroll position is the source of truth for which photo is showing, so
    // swipes, arrows and keys all stay in agreement.
    const handleScroll = useCallback(() => {
        const track = trackRef.current;
        if (!track || track.clientWidth === 0) return;
        const index = Math.round(track.scrollLeft / track.clientWidth);
        setCurrentIndex((prev) => (prev === index ? prev : Math.min(Math.max(index, 0), photos.length - 1)));
    }, [photos.length]);

    const scrollToIndex = useCallback((index: number) => {
        const track = trackRef.current;
        if (!track) return;
        const clamped = (index + photos.length) % photos.length;
        track.scrollTo({ left: track.clientWidth * clamped, behavior: 'smooth' });
    }, [photos.length]);

    const handleNext = useCallback(() => scrollToIndex(currentIndex + 1), [scrollToIndex, currentIndex]);
    const handlePrev = useCallback(() => scrollToIndex(currentIndex - 1), [scrollToIndex, currentIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handleNext, handlePrev]);

    // Warm the share sheet. iOS revokes the user activation across a slow await,
    // so the bytes have to be sitting here already when Save is tapped.
    useEffect(() => {
        if (strategy !== 'share' || !currentId) return;
        if (readyFile?.index === currentIndex) return;

        const controller = new AbortController();
        fetchPhotoFile(currentId, token, controller.signal)
            .then((file) => setReadyFile({ index: currentIndex, file }))
            // Best-effort: saving falls back to fetching on tap.
            .catch(() => { });
        return () => controller.abort();
    }, [strategy, currentId, currentIndex, token, readyFile?.index]);

    const handleSave = async () => {
        if (!currentId || saving) return;
        setSaving(true);
        try {
            if (strategy === 'share') {
                const file = readyFile?.index === currentIndex
                    ? readyFile.file
                    : await fetchPhotoFile(currentId, token);
                await sharePhotoFiles([file]);
            } else {
                await downloadPhoto(currentId, token);
                toast.success('Photo saved');
            }
        } catch (error) {
            if (error instanceof ShareCancelled) return;
            if (error instanceof ShareNeedsGesture) {
                toast.error('Tap save again to open the share sheet');
                return;
            }
            toast.error(error instanceof Error ? error.message : 'Could not save that photo');
        } finally {
            setSaving(false);
        }
    };

    if (!currentPhoto) return null;

    const saveLabel = strategy === 'share' ? 'Save to Photos' : 'Download';

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Top chrome */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center gap-2 p-3 sm:p-4 bg-linear-to-b from-black/60 to-transparent">
                <span className="text-white/60 text-sm font-mono tabular-nums">
                    {currentIndex + 1} / {photos.length}
                </span>
                <div className="flex-1" />
                {allowSave && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSave}
                        disabled={saving}
                        className="text-white hover:text-white hover:bg-white/15 rounded-full px-3"
                    >
                        {saving
                            ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            : strategy === 'share'
                                ? <Share2 className="w-4 h-4 mr-1.5" />
                                : <Download className="w-4 h-4 mr-1.5" />}
                        <span className="text-xs">{saving ? 'Preparing…' : saveLabel}</span>
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Desktop arrows. On touch devices the swipe track handles this. */}
            {photos.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white hover:bg-white/10 w-12 h-12 rounded-full"
                        onClick={handlePrev}
                        aria-label="Previous photo"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white hover:bg-white/10 w-12 h-12 rounded-full"
                        onClick={handleNext}
                        aria-label="Next photo"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </Button>
                </>
            )}

            {/*
              One slide per photo in a snap-scrolling track: swiping is native, so it
              keeps the platform's own momentum and rubber-band feel instead of a
              hand-rolled gesture handler. `overscroll-contain` stops a swipe past
              the last photo from dragging the page behind it.
            */}
            <div
                ref={trackRef}
                onScroll={handleScroll}
                onClick={onClose}
                className="flex h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory overscroll-contain scrollbar-none"
                style={{ scrollbarWidth: 'none' }}
            >
                {photos.map((photo, index) => (
                    <LightboxSlide
                        key={String(photo.id)}
                        photoId={String(photo.id)}
                        token={token}
                        variant={variant}
                        load={Math.abs(index - currentIndex) <= PRELOAD_RADIUS}
                    />
                ))}
            </div>
        </div>
    );
}
