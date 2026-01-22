import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export function Navigation() {
    return (
        <nav className="nav">
            <div className="container flex items-center justify-between">
                <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    Stillroom
                </Link>
                <div className="flex items-center" style={{ gap: '1rem' }}>
                    <SignedIn>
                        <Link href="/dashboard" className="button ghost">Dashboard</Link>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="button">Sign In</button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>
        </nav>
    );
}
