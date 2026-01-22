import { auth } from '@clerk/nextjs/server';
import { Navigation } from '@/components/navigation';
import Link from 'next/link';
import { redirect } from 'next/navigation';



export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    return (
        <main>
            <Navigation />
            <div className="container" style={{ paddingTop: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dashboard</h1>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <Link href="/dashboard/projects" className="card" style={{
                        padding: '1.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        display: 'block',
                        transition: 'border-color 0.2s'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Projects</h2>
                        <p style={{ color: 'var(--muted-foreground)' }}>Manage your photo galleries</p>
                    </Link>

                    <div className="card" style={{
                        padding: '1.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Analytics</h2>
                        <p style={{ color: 'var(--muted-foreground)' }}>View download limits and stats</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
