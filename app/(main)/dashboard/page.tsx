import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FolderOpen, BarChart3, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    return (
        <main>
            <div className="w-full px-10 py-10">
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Welcome back to Stillroom.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Link href="/dashboard/projects" className="block group h-full">
                        <Card className="h-full hover:shadow-md transition-all border-muted-foreground/20 hover:border-primary/50 group-hover:-translate-y-0.5">
                            <CardHeader>
                                <div className="p-2 w-fit bg-primary/5 rounded-md mb-2">
                                    <FolderOpen className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle className="group-hover:text-primary transition-colors">Projects</CardTitle>
                                <CardDescription>Manage your photo galleries and uploads.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-primary flex items-center gap-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                View Projects <ArrowRight className="w-4 h-4" />
                            </CardContent>
                        </Card>
                    </Link>

                    <div className="block h-full opacity-60">
                        <Card className="h-full border-dashed bg-muted/20">
                            <CardHeader>
                                <div className="p-2 w-fit bg-muted rounded-md mb-2">
                                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-muted-foreground">Analytics</CardTitle>
                                <CardDescription>Download stats and storage usage.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground">
                                Coming Soon
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
