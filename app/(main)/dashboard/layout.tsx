export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // The albums workspace brings its own persistent sidebar shell,
    // so the dashboard no longer renders a top navbar.
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    );
}
