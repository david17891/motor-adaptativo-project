"use client";

import React from "react";
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
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Grupos", href: "/dashboard/groups", icon: Users },
    { name: "Alumnos", href: "/dashboard/students", icon: GraduationCap },
    { name: "Exámenes", href: "/dashboard/exams", icon: FileText },
    { name: "Banco de Preguntas", href: "/dashboard/questions", icon: BookOpen },
    { name: "Ajustes", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">M</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
                        Adaptativo
                    </span>
                </div>

                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-zinc-100 dark:bg-zinc-900 text-blue-600 dark:text-blue-400"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
                                )}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
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
        </aside>
    );
}
