import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-black font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto px-8 py-12">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
