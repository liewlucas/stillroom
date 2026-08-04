'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, X, UploadCloud, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';

interface UploadFile extends File {
    preview: string;
    id: string;
}

interface UploadStatus {
    id: string;
    status: 'pending' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
}

async function readError(res: Response, fallback: string) {
    try {
        const data = await res.json();
        return typeof data?.error === 'string' ? data.error : fallback;
    } catch {
        return fallback;
    }
}

/**
 * XHR rather than fetch: it's the only way to observe upload progress, and a
 * direct-to-R2 PUT of a large original is exactly where a progress bar matters.
 */
function putToR2(
    url: string,
    file: File,
    contentType: string,
    onProgress: (progress: number) => void,
) {
    return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        // Must match the Content-Type baked into the presigned signature.
        xhr.setRequestHeader('Content-Type', contentType);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Storage rejected the upload (${xhr.status})`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error reaching storage'));
        xhr.onabort = () => reject(new Error('Upload cancelled'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));

        xhr.send(file);
    });
}

export function GalleryUploader({ projectId }: { projectId: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});
    const [isGlobalUploading, setIsGlobalUploading] = useState(false);

    useEffect(() => {
        return () => files.forEach(file => URL.revokeObjectURL(file.preview));
    }, [files]);

    useEffect(() => {
        if (!open) {
            // Wait for animation or immediate clear? Immediate is safer for "next open"
            // But we might want to delay slightly if there is a closing animation,
            // however, clearing data typically doesn't hurt the closing animation unless it displays that data.
            // Let's clear immediately to be safe, or we can use a small timeout if needed.
            // Actually, for better UX, let's wait a tiny bit so the user doesn't see content vanish *while* it's fading out.
            const t = setTimeout(() => {
                setFiles([]);
                setUploadStatuses({});
            }, 300); // 300ms is typical dialog transition
            return () => clearTimeout(t);
        }
    }, [open]);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        const newFiles = acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file),
            id: crypto.randomUUID()
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Initialize status
        const newStatuses: Record<string, UploadStatus> = {};
        newFiles.forEach(file => {
            newStatuses[file.id] = { id: file.id, status: 'pending', progress: 0 };
        });
        setUploadStatuses(prev => ({ ...prev, ...newStatuses }));

        if (fileRejections.length > 0) {
            toast.error(`${fileRejections.length} files rejected.`);
        }
    }, []);

    const removeFile = (id: string) => {
        if (isGlobalUploading) return;
        setFiles(prev => prev.filter(f => f.id !== id));
        setUploadStatuses(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        disabled: isGlobalUploading
    });

    const uploadSingleFile = async (file: UploadFile) => {
        const setStatus = (s: Partial<UploadStatus>) => {
            setUploadStatuses(prev => ({
                ...prev,
                [file.id]: { ...prev[file.id], ...s }
            }));
        };

        try {
            // 1. Ask the server for a presigned PUT. File bytes never go through
            //    a route handler — Vercel rejects request bodies over 4.5MB.
            setStatus({ status: 'preparing', progress: 0 });
            const contentType = file.type || 'image/jpeg';

            const urlRes = await fetch('/api/photos/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    filename: file.name,
                    contentType,
                    fileSize: file.size,
                }),
            });

            if (!urlRes.ok) {
                throw new Error(await readError(urlRes, 'Could not start upload'));
            }

            const { uploadUrl, key, photoId } = await urlRes.json();

            // 2. Send the original straight to R2, tracking real progress.
            setStatus({ status: 'uploading', progress: 0 });
            await putToR2(uploadUrl, file, contentType, (progress) => {
                setStatus({ status: 'uploading', progress });
            });

            // 3. Have the server build variants and record the photo.
            setStatus({ status: 'processing', progress: 100 });
            const finalizeRes = await fetch('/api/photos/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    photoId,
                    key,
                    filename: file.name,
                    contentType,
                }),
            });

            if (!finalizeRes.ok) {
                throw new Error(await readError(finalizeRes, 'Could not process image'));
            }

            setStatus({ status: 'completed', progress: 100 });

        } catch (error) {
            console.error(error);
            setStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
            });
        }
    };

    // Monitor upload completion. 'error' is terminal alongside 'completed' —
    // keying only off 'completed' leaves the dialog stuck when one file fails.
    useEffect(() => {
        if (!isGlobalUploading && files.length > 0) {
            const settled = files.every(f => {
                const status = uploadStatuses[f.id]?.status;
                return status === 'completed' || status === 'error';
            });
            if (!settled) return;

            const failed = files.filter(f => uploadStatuses[f.id]?.status === 'error');
            const succeeded = files.length - failed.length;

            if (succeeded > 0) router.refresh();

            if (failed.length === 0) {
                toast.success('Upload complete');
                // Short delay to let user see the green checks
                const t = setTimeout(() => {
                    setOpen(false);
                    // The other useEffect will clear the files/statuses on close
                }, 500);
                return () => clearTimeout(t);
            }

            // Leave the dialog open so failures stay visible and retryable.
            toast.error(
                succeeded > 0
                    ? `${succeeded} uploaded, ${failed.length} failed`
                    : `${failed.length} photo${failed.length === 1 ? '' : 's'} failed to upload`
            );
        }
    }, [isGlobalUploading, files, uploadStatuses, router]);

    const handleStartUpload = async () => {
        // Errored files are picked up too, so the button doubles as a retry.
        const queue = files.filter(f => {
            const status = uploadStatuses[f.id]?.status;
            return status === 'pending' || status === 'error';
        });

        if (queue.length === 0) return;

        setIsGlobalUploading(true);
        setUploadStatuses(prev => {
            const next = { ...prev };
            queue.forEach(f => {
                next[f.id] = { ...next[f.id], status: 'pending', progress: 0, error: undefined };
            });
            return next;
        });

        // Sequential upload to prevent hanging/race conditions
        for (const file of queue) {
            await uploadSingleFile(file);
        }

        setIsGlobalUploading(false);
    };

    const hasFailures = files.some(f => uploadStatuses[f.id]?.status === 'error');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload Photos</DialogTitle>
                    <DialogDescription>
                        Drag and drop photos here to add them to your project gallery.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all bg-muted/50 hover:bg-muted",
                            isDragActive && "border-primary bg-primary/5",
                            isGlobalUploading && "pointer-events-none opacity-50"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                            <UploadCloud className="w-10 h-10 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground mt-1">Images up to 50MB</p>
                            </div>
                        </div>
                    </div>

                    {/* File Queue */}
                    {files.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Queue ({files.length})</h4>
                                <div className="flex gap-2">
                                    {!isGlobalUploading && (
                                        <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="h-8 text-destructive">
                                            Clear
                                        </Button>
                                    )}
                                    <Button size="sm" onClick={handleStartUpload} disabled={isGlobalUploading}>
                                        {isGlobalUploading ? (
                                            <>
                                                <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Uploading...
                                            </>
                                        ) : hasFailures ? 'Retry Failed' : 'Start Upload'}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {files.map((file) => {
                                    const status = uploadStatuses[file.id];
                                    return (
                                        <div key={file.id} className="relative group bg-background border rounded-lg overflow-hidden flex flex-col">
                                            <div className="relative aspect-video bg-muted">
                                                <Image src={file.preview} alt={file.name} fill className="object-cover" />
                                                {status.status === 'completed' && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                    </div>
                                                )}
                                                {status.status === 'processing' && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                    </div>
                                                )}
                                                {status.status === 'error' && (
                                                    <div className="absolute inset-0 bg-destructive/40 flex items-center justify-center">
                                                        <AlertCircle className="w-6 h-6 text-white" />
                                                    </div>
                                                )}
                                                {!isGlobalUploading && status.status !== 'completed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFile(file.id) }}
                                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-2">
                                                <p className="text-xs truncate font-medium">{file.name}</p>
                                                <div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all", status.status === 'error' ? 'bg-destructive' : 'bg-primary')}
                                                        style={{ width: `${status.status === 'error' ? 100 : status.progress}%` }}
                                                    />
                                                </div>
                                                {status.status === 'error' && (
                                                    <p className="text-[11px] text-destructive mt-1 leading-tight">
                                                        {status.error || 'Upload failed'}
                                                    </p>
                                                )}
                                                {status.status === 'processing' && (
                                                    <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                                                        Processing…
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
