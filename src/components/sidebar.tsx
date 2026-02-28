"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    FileText,
    School,
    GraduationCap,
    LogOut,
    FolderTree,
    CreditCard,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Grupos", href: "/dashboard/groups", icon: Users },
    { name: "Alumnos", href: "/dashboard/students", icon: GraduationCap },
    { name: "Pagos", href: "/dashboard/payments", icon: CreditCard },
    { name: "Exámenes", href: "/dashboard/exams", icon: FileText },
    { name: "Banco de Preguntas", href: "/dashboard/questions", icon: BookOpen },
    { name: "Catálogo Curricular", href: "/dashboard/curriculum", icon: FolderTree },
    { name: "Portal Alumnos", href: "/student", icon: School },
    { name: "Ajustes", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const NavContent = () => (
        <>
            <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">M</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
                            Adaptativo
                        </span>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all",
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                                )}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/" showName />
                </div>
                <div className="pt-2">
                    <OrganizationSwitcher
                        afterCreateOrganizationUrl="/dashboard"
                        afterSelectOrganizationUrl="/dashboard"
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                organizationSwitcherTrigger: "w-full justify-between"
                            }
                        }}
                    />
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Header/Trigger */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                        Adaptativo
                    </span>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Desktop & Mobile Drawer */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transform lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out flex flex-col h-screen",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <NavContent />
            </aside>
        </>
    );
}
