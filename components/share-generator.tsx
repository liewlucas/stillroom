'use client';

import { useState } from 'react';

export function ShareGenerator({ projectId }: { projectId: string }) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const generateLink = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            const data = await res.json();
            if (data.token) {
                setToken(data.token);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
            <div className="flex items-center justify-between">
                <div>
                    <h3>Share this Project</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Generate a secure link for clients</p>
                </div>
                <button onClick={generateLink} disabled={loading} className="button">
                    {loading ? 'Generating...' : 'Create Link'}
                </button>
            </div>
            {token && (
                <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                    <code style={{ wordBreak: 'break-all' }}>
                        {typeof window !== 'undefined' ? window.location.origin : ''}/share/{token}
                    </code>
                </div>
            )}
        </div>
    );
}
