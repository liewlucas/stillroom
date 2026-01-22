'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Loader2, X, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface UploadFile extends File {
    preview: string;
    id: string; // unique identifier
}

interface UploadStatus {
    id: string;
    status: 'pending' | 'signing' | 'uploading' | 'optimizing' | 'completed' | 'error';
    progress: number;
    error?: string;
}

export default function UploadPage({ params }: { params: Promise<{ projectId: string }> }) {
    const router = useRouter();
    const [projectId, setProjectId] = useState<string | null>(null);

    // Hydrate params
    useEffect(() => {
        params.then(p => setProjectId(p.projectId));
    }, [params]);

    const [files, setFiles] = useState<UploadFile[]>([]);
    const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});
    const [isGlobalUploading, setIsGlobalUploading] = useState(false);

    // Clean up previews to avoid memory leaks
    useEffect(() => {
        return () => files.forEach(file => URL.revokeObjectURL(file.preview));
    }, [files]);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        const newFiles = acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substring(7) + Date.now()
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Initialize status for new files
        const newStatuses: Record<string, UploadStatus> = {};
        newFiles.forEach(file => {
            newStatuses[file.id] = { id: file.id, status: 'pending', progress: 0 };
        });
        setUploadStatuses(prev => ({ ...prev, ...newStatuses }));
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
        if (!projectId) return;

        const setStatus = (s: Partial<UploadStatus>) => {
            setUploadStatuses(prev => ({
                ...prev,
                [file.id]: { ...prev[file.id], ...s }
            }));
        };

        try {
            setStatus({ status: 'signing', progress: 10 });

            // 1. Get Signed URL
            const signRes = await fetch('/api/uploads/sign', {
                method: 'POST',
                body: JSON.stringify({
                    projectId,
                    filename: file.name,
                    contentType: file.type,
                    size: file.size
                })
            });

            if (!signRes.ok) throw new Error('Failed to sign upload');
            const { uploadUrl, key } = await signRes.json();

            // 2. Upload to R2 (with fake progress simulation since fetch doesn't support generic progress events easily)
            setStatus({ status: 'uploading', progress: 30 });

            // XHR allows for progress monitoring, but simple fetch is often enough coupled with a fake progress interval 
            // For simplicity and robustness in this environment, we'll use fetch and just jump progress.
            // If strict progress is needed, we would use XMLHttpRequest.

            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (!uploadRes.ok) throw new Error('Failed to upload to storage');

            setStatus({ status: 'optimizing', progress: 80 });

            // 3. Complete Upload
            // Get simple dimensions (in a real app, maybe use an image library to get actual dims)
            // For now, we'll send 0,0 or basic placeholders. 
            // Better: use an offscreen image to get dims before upload.
            const img = document.createElement('img');
            img.src = file.preview;
            await new Promise((resolve) => { img.onload = resolve; });

            const completeRes = await fetch('/api/photos/complete', {
                method: 'POST',
                body: JSON.stringify({
                    projectId,
                    r2_key: key,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    file_size: file.size
                })
            });

            if (!completeRes.ok) throw new Error('Failed to complete metadata save');

            setStatus({ status: 'completed', progress: 100 });

        } catch (error) {
            console.error(error);
            setStatus({ status: 'error', error: 'Upload Failed' });
        }
    };

    const handleStartUpload = async () => {
        setIsGlobalUploading(true);
        const pendingFiles = files.filter(f => uploadStatuses[f.id]?.status === 'pending');

        // Parallel uploads - limit concurrency if needed, but for now map all
        await Promise.all(pendingFiles.map(file => uploadSingleFile(file)));

        // Keep global uploading true for a moment to show completion state
        setIsGlobalUploading(false);

        // If all completed, redirect
        const allCompleted = files.every(f => uploadStatuses[f.id]?.status === 'completed');
        if (allCompleted) {
            setTimeout(() => router.push(`/dashboard/projects/${projectId}`), 1000);
        }
    };

    return (
        <div className="container max-w-4xl py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Upload Photos</h1>
                    <p className="text-muted-foreground mt-1">Add photos to your project gallery.</p>
                </div>
                {files.length > 0 && !isGlobalUploading && (
                    <Button onClick={() => setFiles([])} variant="ghost" className="text-destructive hover:bg-destructive/10">
                        Clear All
                    </Button>
                )}
            </div>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out",
                    isDragActive
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
                    isGlobalUploading && "pointer-events-none opacity-50"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className={cn("p-4 rounded-full bg-muted", isDragActive && "bg-background")}>
                        <UploadCloud className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium text-lg">
                            {isDragActive ? "Drop photos now" : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            SVG, PNG, JPG or WEBP (max 50MB)
                        </p>
                    </div>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="mt-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Queue ({files.length})</h3>
                        {!isGlobalUploading && (
                            <Button onClick={handleStartUpload} size="lg">
                                Start Upload
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file) => {
                            const status = uploadStatuses[file.id];
                            return (
                                <div key={file.id} className="group relative bg-card border rounded-lg overflow-hidden flex flex-col shadow-sm">
                                    {/* Image Preview */}
                                    <div className="relative aspect-[3/2] bg-muted">
                                        <Image
                                            src={file.preview}
                                            alt={file.name}
                                            fill
                                            className="object-cover"
                                        />

                                        {/* Status Overlay */}
                                        {status.status === 'completed' && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="bg-green-500 text-white p-2 rounded-full">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                            </div>
                                        )}

                                        {status.status === 'error' && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="bg-destructive text-white p-2 rounded-full">
                                                    <AlertCircle className="w-6 h-6" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Remove Button */}
                                        {!isGlobalUploading && status.status !== 'completed' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Info & Progress */}
                                    <div className="p-3 flex flex-col gap-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="truncate max-w-[150px] font-medium" title={file.name}>{file.name}</span>
                                            <span className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-300",
                                                    status.status === 'error' ? "bg-destructive" : "bg-primary"
                                                )}
                                                style={{ width: `${status.progress}%` }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                            <span>{status.status}</span>
                                            <span>{status.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
