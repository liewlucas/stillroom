'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Download, CheckSquare, Square, X, Share2, ExternalLink } from 'lucide-react';
import { Photo } from '@/components/photo';
import { PhotoLightbox } from '@/components/photo-lightbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { downloadPhoto, isInAppBrowser } from '@/lib/photo-save';
import { useIsClient } from '@/lib/use-is-client';
import { useSaveRun } from '@/lib/use-save-run';

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
    galleryId: string;
    /** Presigned during SSR so the hero paints without a client roundtrip. */
    hero?: { url: string } | null;
}

const GUIDE_STORAGE_KEY = 'stillroom.download-guide-dismissed';

export function PublicGalleryView({ gallery, photographer, photos, token, galleryId, hero }: PublicGalleryViewProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [guideDismissed, setGuideDismissed] = useState(false);
    // Drives the sticky header: once the hero scrolls away there is otherwise no
    // download control on screen, which is what clients were tripping over.
    const [heroVisible, setHeroVisible] = useState(true);
    const heroRef = useRef<HTMLElement | null>(null);

    const isClient = useIsClient();
    const inAppBrowser = isClient && isInAppBrowser();
    const showGuide = useMemo(() => {
        if (!isClient || guideDismissed) return false;
        try {
            return window.localStorage.getItem(GUIDE_STORAGE_KEY) !== '1';
        } catch {
            return true;
        }
    }, [isClient, guideDismissed]);

    const allIds = useMemo(() => photos.map((p) => String(p.id)), [photos]);

    const downloadZip = useCallback(async (ids: string[]) => {
        const res = await fetch('/api/photos/bulk-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoIds: ids, projectId: galleryId, token }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Download failed');
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${gallery.title.replace(/\s+/g, '-').toLowerCase()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    }, [galleryId, token, gallery.title]);

    const save = useSaveRun({ token, albumTitle: gallery.title, onZip: downloadZip });
    const { run, pendingFiles, shareFlow, chunkSize, busy, progress } = save;

    useEffect(() => {
        const el = heroRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setHeroVisible(entry.isIntersecting),
            { threshold: 0.15 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hero]);

    const dismissGuide = () => {
        setGuideDismissed(true);
        try { window.localStorage.setItem(GUIDE_STORAGE_KEY, '1'); } catch { /* private mode */ }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const selectAll = () => setSelectedIds(new Set(allIds));
    const clearSelection = () => setSelectedIds(new Set());

    const enterSelectMode = () => {
        setSelectMode(true);
        setSelectedIds(new Set());
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
    };

    const handlePhotoClick = (index: number, id: string) => {
        if (selectMode) toggleSelect(id);
        else setLightboxIndex(index);
    };

    const saveOne = async (id: string) => {
        try {
            await downloadPhoto(id, token);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not save that photo');
        }
    };

    const startSelected = () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        setSelectMode(false);
        save.start(ids);
    };

    const selectedCount = selectedIds.size;
    const runActive = Boolean(run);

    // Labelled by outcome, and by what the device will actually do — an icon alone
    // is not a recognisable download affordance.
    const SaveIcon = shareFlow ? Share2 : Download;
    const saveAllLabel = shareFlow ? `Save all ${photos.length} to Photos` : `Download all ${photos.length}`;

    const advanceLabel = (() => {
        if (progress) return `Preparing ${progress.done}/${progress.total}…`;
        if (busy) return 'Working…';
        if (pendingFiles) return `Save ${pendingFiles.length} to Photos`;
        const next = Math.min(chunkSize, run?.remaining.length ?? 0);
        return `Save next ${next}`;
    })();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Sticky header — the conventional place clients look for a download,
                and the only control on screen once the hero is gone. */}
            {photos.length > 0 && !selectMode && !runActive && (!hero || !heroVisible) && (
                <div className="fixed top-0 inset-x-0 z-30 border-b bg-background/90 backdrop-blur-md">
                    <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 h-14">
                        <span className="text-sm font-medium truncate flex-1 min-w-0">{gallery.title}</span>
                        <button
                            onClick={enterSelectMode}
                            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                        >
                            <CheckSquare className="w-4 h-4" /> Select photos
                        </button>
                        <Button size="sm" onClick={() => save.start(allIds)} disabled={busy}>
                            <SaveIcon className="w-4 h-4 mr-1.5" />
                            {shareFlow ? 'Save all' : 'Download all'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Hero */}
            {hero ? (
                <section
                    ref={heroRef}
                    className="relative w-full h-[70vh] min-h-100 sm:h-[80vh] bg-muted overflow-hidden"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={hero.url}
                        alt=""
                        fetchPriority="high"
                        onClick={() => setLightboxIndex(0)}
                        className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/5 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 pointer-events-none">
                        <div className="max-w-3xl mx-auto text-center text-white">
                            {photographer.display_name && (
                                <div className="flex items-center justify-center gap-1.5 mb-4 text-white/80">
                                    <Camera className="w-3.5 h-3.5" />
                                    <span className="text-sm font-medium tracking-wide">{photographer.display_name}</span>
                                </div>
                            )}
                            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance drop-shadow-lg">
                                {gallery.title}
                            </h1>
                            {gallery.description && (
                                <p className="text-white/85 text-sm sm:text-base leading-relaxed mt-3 text-pretty">
                                    {gallery.description}
                                </p>
                            )}
                            {photos.length > 0 && (
                                <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 mt-7">
                                    <Button
                                        size="lg"
                                        onClick={() => save.start(allIds)}
                                        disabled={busy || runActive}
                                        className="rounded-full shadow-lg"
                                    >
                                        <SaveIcon className="w-4 h-4 mr-2" />
                                        {saveAllLabel}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={enterSelectMode}
                                        className="rounded-full border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                                    >
                                        <CheckSquare className="w-4 h-4 mr-2" />
                                        Select photos
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            ) : (
                <header className="px-6 pt-12 pb-6 text-center max-w-2xl mx-auto w-full">
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
                    {photos.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                            <Button onClick={() => save.start(allIds)} disabled={busy || runActive} className="rounded-full">
                                <SaveIcon className="w-4 h-4 mr-2" />
                                {saveAllLabel}
                            </Button>
                            <Button variant="outline" onClick={enterSelectMode} className="rounded-full">
                                <CheckSquare className="w-4 h-4 mr-2" /> Select photos
                            </Button>
                        </div>
                    )}
                </header>
            )}

            {/* First-visit orientation. Every client gallery platform ships some
                version of this because the flow is never self-evident. */}
            {showGuide && photos.length > 0 && (
                <div className="mx-4 mt-6 rounded-xl border bg-card px-4 py-3 flex items-start gap-3 max-w-2xl sm:mx-auto w-full sm:w-auto">
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                        Tap any photo to see it full screen, then{' '}
                        <span className="font-medium text-foreground">{shareFlow ? 'Save to Photos' : 'Download'}</span>.
                        {shareFlow
                            ? ' To save everything, use Save all — your phone will ask you to confirm each batch.'
                            : ' Or use Download all to get the whole album at once.'}
                    </p>
                    <button onClick={dismissGuide} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Dismiss">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Embedded browsers routinely support neither the share sheet nor
                downloads, and fail without any error — say so rather than leaving
                a dead button. */}
            {inAppBrowser && (
                <div className="mx-4 mt-4 rounded-lg border bg-muted/50 px-4 py-3 flex items-start gap-2 max-w-2xl sm:mx-auto w-full sm:w-auto">
                    <ExternalLink className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        You&apos;re viewing this inside another app. To save photos to your phone,
                        open this page in Safari or Chrome.
                    </p>
                </div>
            )}

            {/* Count */}
            <div className="flex items-center justify-center py-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </p>
            </div>

            {/* Photo Grid */}
            <div className="flex-1 px-1 pb-32">
                {photos.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>No photos in this album yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5">
                        {photos.map((photo, index) => {
                            const id = String(photo.id);
                            const selected = selectedIds.has(id);
                            return (
                                <div
                                    key={id}
                                    className="relative aspect-square bg-muted overflow-hidden cursor-pointer group"
                                    onClick={() => handlePhotoClick(index, id)}
                                >
                                    <Photo
                                        photoId={id}
                                        token={token}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Pointer-only affordance: on touch the lightbox's
                                        labelled Save button is the path. */}
                                    {!selectMode && !shareFlow && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); saveOne(id); }}
                                            aria-label="Download this photo"
                                            className="hidden sm:flex absolute top-2 right-2 w-8 h-8 rounded-full bg-black/55 text-white items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-black/75"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    )}
                                    {selectMode && (
                                        <div className={`absolute inset-0 transition-colors ${selected ? 'bg-primary/30' : 'bg-transparent'}`}>
                                            <div className="absolute top-2 left-2">
                                                {selected
                                                    ? <CheckSquare className="w-5 h-5 text-white drop-shadow" />
                                                    : <Square className="w-5 h-5 text-white/70 drop-shadow" />
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="py-8 text-center border-t">
                <p className="text-xs text-muted-foreground">
                    Delivered by <span className="font-semibold text-foreground">stillRoom</span>
                </p>
            </footer>

            {/* Bottom bar: an in-flight save takes precedence over selection. */}
            {(runActive || selectMode) && (
                <div className="fixed bottom-0 inset-x-0 z-40 bg-background border-t shadow-lg">
                    {runActive && run && (
                        <div className="h-1 bg-muted">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${Math.round((run.done / run.total) * 100)}%` }}
                            />
                        </div>
                    )}
                    <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
                        {runActive && run ? (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                        {run.done} of {run.total} saved
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {progress
                                            ? `Preparing ${progress.done}/${progress.total}…`
                                            : `${run.remaining.length} to go`}
                                    </p>
                                </div>
                                <Button size="sm" onClick={save.advance} disabled={busy}>
                                    <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
                                    {advanceLabel}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={save.cancel} aria-label="Stop saving">
                                    <X className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <span className="text-sm font-medium flex-1 min-w-0 truncate">
                                    {selectedCount > 0 ? `${selectedCount} selected` : 'Tap photos to select'}
                                </span>
                                <button
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 px-2 py-2"
                                    onClick={selectedCount === photos.length ? clearSelection : selectAll}
                                >
                                    {selectedCount === photos.length ? 'Deselect all' : 'Select all'}
                                </button>
                                <Button size="sm" disabled={selectedCount === 0 || busy} onClick={startSelected} className="shrink-0">
                                    <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
                                    {shareFlow ? `Save ${selectedCount || ''}`.trim() : 'Download'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={exitSelectMode} aria-label="Cancel selection">
                                    <X className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <PhotoLightbox
                    photos={photos}
                    initialIndex={lightboxIndex}
                    token={token}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
}
