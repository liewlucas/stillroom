import { Navbar } from '@/components/navbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Navbar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
