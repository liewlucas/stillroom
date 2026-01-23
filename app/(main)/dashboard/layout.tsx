import Link from 'next/link';
import { UserButton } from "@clerk/nextjs";
import { LayoutGrid, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await currentUser();

    return (
        <div className="flex h-screen w-full bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/30 hidden md:flex flex-col">
                <div className="p-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
                        <div className="h-6 w-6 bg-primary rounded-sm" />
                        Stillroom
                    </Link>
                </div>

                <div className="px-4 mb-4">
                    <Link href="/dashboard/galleries/new">
                        <Button className="w-full justify-start" size="sm">
                            <Plus className="mr-2 h-4 w-4" /> New Gallery
                        </Button>
                    </Link>
                </div>

                <Separator className="mb-4" />

                <nav className="flex-1 px-4 space-y-1">
                    <Link href="/dashboard/galleries">
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                            <FolderOpen className="mr-2 h-4 w-4" /> Galleries
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                            <LayoutGrid className="mr-2 h-4 w-4" /> Dashboard
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t">
                    <div className="flex items-center gap-3">
                        <UserButton afterSignOutUrl="/" />
                        <div className="text-sm">
                            <p className="font-medium">{user?.firstName || 'User'} {user?.lastName}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header (TODO: Sheet for mobile sidebar) */}
                <header className="md:hidden border-b p-4 flex items-center justify-between">
                    <span className="font-bold">Stillroom</span>
                    <UserButton />
                </header>

                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
