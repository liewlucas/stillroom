'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/galleries', label: 'Galleries' },
];

export function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
                    <div className="h-5 w-5 bg-primary rounded-sm" />
                    Stillroom
                </Link>

                {/* Desktop nav links */}
                <nav className="hidden md:flex items-center gap-1">
                    <SignedIn>
                        {navLinks.map((link) => (
                            <Button key={link.href} variant="ghost" size="sm" asChild>
                                <Link href={link.href}>{link.label}</Link>
                            </Button>
                        ))}
                    </SignedIn>
                </nav>

                {/* Right side: auth + mobile toggle */}
                <div className="flex items-center gap-2">
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setOpen((prev) => !prev)}
                            aria-label="Toggle menu"
                        >
                            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button size="sm">Sign In</Button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>

            {/* Mobile dropdown */}
            <SignedIn>
                {open && (
                    <nav className="md:hidden border-t bg-background px-4 py-3 flex flex-col gap-1">
                        {navLinks.map((link) => (
                            <Button
                                key={link.href}
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                asChild
                                onClick={() => setOpen(false)}
                            >
                                <Link href={link.href}>{link.label}</Link>
                            </Button>
                        ))}
                    </nav>
                )}
            </SignedIn>
        </header>
    );
}
