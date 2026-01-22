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
import { Upload, X, UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';

interface UploadFile extends File {
    preview: string;
    id: string;
}

interface UploadStatus {
    id: string;
    status: 'pending' | 'signing' | 'uploading' | 'optimizing' | 'completed' | 'error';
    progress: number;
    error?: string;
}

export function ProjectUploader({ projectId }: { projectId: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});
    const [isGlobalUploading, setIsGlobalUploading] = useState(false);

    // Clean up previews
    useEffect(() => {
        return () => files.forEach(file => URL.revokeObjectURL(file.preview));
    }, [files]);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        const newFiles = acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substring(7) + Date.now()
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
            setStatus({ status: 'signing', progress: 10 });
            const signRes = await fetch('/api/uploads/sign', {
                method: 'POST',
                body: JSON.stringify({
                    projectId,
                    filename: file.name,
                    contentType: file.type,
                    size: file.size
                })
            });

            if (!signRes.ok) throw new Error('Failed to sign');
            const { uploadUrl, key } = await signRes.json();

            setStatus({ status: 'uploading', progress: 30 });
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (!uploadRes.ok) throw new Error('Failed to upload');

            setStatus({ status: 'optimizing', progress: 80 });
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

            if (!completeRes.ok) throw new Error('Failed to save metadata');

            setStatus({ status: 'completed', progress: 100 });

        } catch (error) {
            console.error(error);
            setStatus({ status: 'error', error: 'Failed' });
        }
    };

    const handleStartUpload = async () => {
        setIsGlobalUploading(true);
        const pendingFiles = files.filter(f => uploadStatuses[f.id]?.status === 'pending');

        if (pendingFiles.length === 0) {
            setIsGlobalUploading(false);
            return;
        }

        await Promise.all(pendingFiles.map(file => uploadSingleFile(file)));

        setIsGlobalUploading(false);

        // If all completed, refresh page and maybe close modal after delay
        const allCompleted = files.every(f => uploadStatuses[f.id]?.status === 'completed');
        if (allCompleted) {
            toast.success('Upload complete');
            router.refresh();
            setTimeout(() => {
                setOpen(false);
                setFiles([]);
            }, 1000);
        }
    };

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
                                        ) : 'Start Upload'}
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
                                                        style={{ width: `${status.progress}%` }}
                                                    />
                                                </div>
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
