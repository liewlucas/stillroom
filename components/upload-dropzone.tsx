'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UploadDropzone({ projectId }: { projectId: string }) {
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);

        try {
            const files = Array.from(e.target.files);

            for (const file of files) {
                // 1. Request Signed URL
                const res = await fetch('/api/photos/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId,
                        filename: file.name,
                        contentType: file.type,
                        size: file.size,
                        // width/height would ideally be extracted client-side before upload using generic image loading
                    })
                });

                if (!res.ok) throw new Error('Failed to get upload URL');

                const { uploadUrl, key, photoId } = await res.json();

                // 2. Upload to R2
                const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type
                    }
                });

                if (!uploadRes.ok) throw new Error('Upload to R2 failed');
            }

            router.refresh();
            alert('Upload successful!');

        } catch (e) {
            console.error(e);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: '2rem',
            textAlign: 'center',
            margin: '2rem 0'
        }}>
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
                id="file-upload"
            />
            <label htmlFor="file-upload" className="button outline" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? 'Uploading...' : 'Upload Photos'}
            </label>
        </div>
    );
}
