'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useIsClient } from '@/lib/use-is-client';
import {
    MAX_SEQUENTIAL_DOWNLOADS,
    MAX_SHARE_FILES,
    ShareCancelled,
    ShareNeedsGesture,
    downloadPhotosSequentially,
    fetchPhotoFiles,
    getSaveStrategy,
    sharePhotoFiles,
    type SaveStrategy,
} from '@/lib/photo-save';

/**
 * A save "run" — one or many photos on their way to the device, in chunks.
 *
 * Whole-album saves cannot complete in a single tap on a phone: iOS holds every
 * shared file in memory at once, and Chrome throttles long download bursts. So a
 * run hands over one chunk per tap and reports progress in between, rather than
 * silently truncating the selection or falling back to a zip the client then has
 * to work out how to unpack.
 */
export type SaveRun = {
    remaining: string[];
    total: number;
    done: number;
    mode: Exclude<SaveStrategy, 'zip'>;
};

export function useSaveRun({
    token,
    albumTitle,
    onZip,
}: {
    token?: string;
    albumTitle: string;
    /** Desktop multi-select still zips — one file is the better outcome there. */
    onZip: (ids: string[]) => Promise<void>;
}) {
    // Device capabilities are client-only, so this stays null through SSR and the
    // first client render, then resolves without a cascading re-render.
    const isClient = useIsClient();
    const strategy = useMemo<SaveStrategy | null>(() => (isClient ? getSaveStrategy(1) : null), [isClient]);

    const [run, setRun] = useState<SaveRun | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

    const shareFlow = strategy === 'share';
    const chunkSize = shareFlow ? MAX_SHARE_FILES : MAX_SEQUENTIAL_DOWNLOADS;

    const reset = useCallback(() => {
        setRun(null);
        setPendingFiles(null);
        setProgress(null);
        setBusy(false);
    }, []);

    /** Fetch the next chunk's bytes so the following tap can open the sheet synchronously. */
    const prepare = useCallback(async (ids: string[]) => {
        setProgress({ done: 0, total: ids.length });
        try {
            const files = await fetchPhotoFiles(ids, token, (done, total) => setProgress({ done, total }));
            if (files.length === 0) throw new Error('Could not prepare those photos');
            setPendingFiles(files);
        } finally {
            setProgress(null);
        }
    }, [token]);

    const start = useCallback(async (ids: string[]) => {
        if (ids.length === 0 || busy) return;

        const resolved = getSaveStrategy(ids.length);
        setBusy(true);
        try {
            if (resolved === 'zip') {
                await onZip(ids);
                toast.success(`${ids.length} photo${ids.length === 1 ? '' : 's'} downloaded`);
                reset();
                return;
            }

            const next: SaveRun = { remaining: ids, total: ids.length, done: 0, mode: resolved };
            setRun(next);

            if (resolved === 'share') {
                // Cannot open the sheet from this tap — the bytes have to be fetched
                // first, and iOS revokes the user activation while that happens.
                await prepare(ids.slice(0, MAX_SHARE_FILES));
                return;
            }

            const chunk = ids.slice(0, MAX_SEQUENTIAL_DOWNLOADS);
            setProgress({ done: 0, total: chunk.length });
            await downloadPhotosSequentially(chunk, token, (done, total) => setProgress({ done, total }));
            const remaining = ids.slice(chunk.length);
            if (remaining.length === 0) {
                toast.success(`${ids.length} photo${ids.length === 1 ? '' : 's'} saved`);
                reset();
            } else {
                setRun({ ...next, remaining, done: chunk.length });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Save failed');
            reset();
        } finally {
            setBusy(false);
            setProgress(null);
        }
    }, [busy, onZip, prepare, reset, token]);

    /** The tap that hands the current chunk over, then queues up the next one. */
    const advance = useCallback(async () => {
        if (!run || busy) return;

        if (run.mode === 'share') {
            if (!pendingFiles) {
                setBusy(true);
                try {
                    await prepare(run.remaining.slice(0, MAX_SHARE_FILES));
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Could not prepare those photos');
                } finally {
                    setBusy(false);
                }
                return;
            }

            try {
                await sharePhotoFiles(pendingFiles, albumTitle);
            } catch (error) {
                // Keep the prepared files on cancel so the next tap is instant.
                if (error instanceof ShareCancelled) return;
                if (error instanceof ShareNeedsGesture) {
                    toast.error('Tap save once more to open the share sheet');
                    return;
                }
                toast.error(error instanceof Error ? error.message : 'Could not save those photos');
                return;
            }

            const handed = pendingFiles.length;
            const remaining = run.remaining.slice(handed);
            const done = run.done + handed;
            setPendingFiles(null);

            if (remaining.length === 0) {
                toast.success(`${run.total} photo${run.total === 1 ? '' : 's'} saved`);
                reset();
                return;
            }

            setRun({ ...run, remaining, done });
            setBusy(true);
            try {
                await prepare(remaining.slice(0, MAX_SHARE_FILES));
            } catch {
                // Non-fatal: the next tap retries the fetch.
            } finally {
                setBusy(false);
            }
            return;
        }

        setBusy(true);
        try {
            const chunk = run.remaining.slice(0, MAX_SEQUENTIAL_DOWNLOADS);
            setProgress({ done: 0, total: chunk.length });
            await downloadPhotosSequentially(chunk, token, (done, total) => setProgress({ done, total }));
            const remaining = run.remaining.slice(chunk.length);
            const done = run.done + chunk.length;
            if (remaining.length === 0) {
                toast.success(`${run.total} photo${run.total === 1 ? '' : 's'} saved`);
                reset();
            } else {
                setRun({ ...run, remaining, done });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Save failed');
        } finally {
            setBusy(false);
            setProgress(null);
        }
    }, [run, busy, pendingFiles, prepare, albumTitle, reset, token]);

    return {
        strategy,
        shareFlow,
        chunkSize,
        run,
        pendingFiles,
        busy,
        progress,
        start,
        advance,
        cancel: reset,
    };
}
