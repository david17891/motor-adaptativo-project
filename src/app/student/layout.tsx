import React from "react";
import { logoutStudent } from "./login/actions";
import { LogOut, Lock } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    let hasPendingPayment = false;
    let lockedGroupNames: string[] = [];

    if (studentId) {
        // Fetch all groups the student belongs to
        const groupMemberships = await prisma.groupMember.findMany({
            where: { studentId },
            include: { group: true }
        });

        const now = new Date();

        for (const membership of groupMemberships) {
            const group = membership.group;

            // Calculate current week
            const diffTime = now.getTime() - group.startDate.getTime();
            // If the group hasn't started yet, diffTime is negative, so week 1.
            const diffDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
            let currentWeek = diffDays > 0 ? Math.ceil(diffDays / 7) : 1;

            if (currentWeek > group.durationWeeks) currentWeek = group.durationWeeks;
            if (currentWeek < 1) currentWeek = 1;

            // Check if there is a payment for the current week
            const payment = await prisma.payment.findUnique({
                where: {
                    groupId_studentId_week: {
                        groupId: group.id,
                        studentId: studentId,
                        week: currentWeek
                    }
                }
            });

            if (!payment) {
                hasPendingPayment = true;
                lockedGroupNames.push(`Semana ${currentWeek} del curso ${group.name}`);
            }
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col">
            <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm transition-colors">
                <Link href="/student" className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center shadow-inner">
                        <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center truncate">
                        <span className="font-bold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                            Adaptativo
                        </span>
                        <span className="text-[10px] sm:text-sm font-medium text-zinc-400 dark:text-zinc-500 sm:ml-2 px-2 py-0.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 rounded-full w-fit hidden xs:inline-block">
                            Portal Estudiantil
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="hidden sm:block text-sm text-right">
                        <Link href="/dashboard" className="font-bold text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 block underline decoration-indigo-500/30">Panel Admin</Link>
                    </div>
                    <form action={logoutStudent}>
                        <button type="submit" className="flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-red-600 dark:hover:text-red-400">
                            <span className="hidden md:inline text-sm font-medium">Cerrar Sesión</span>
                            <LogOut size={18} />
                        </button>
                    </form>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {hasPendingPayment ? (
                    <div className="flex flex-col items-center justify-center mt-12 bg-white dark:bg-zinc-950 p-10 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 max-w-2xl mx-auto text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 text-red-600 dark:text-red-500">
                            <Lock size={40} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-4">Acceso Suspendido</h1>
                        <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-8 leading-relaxed">
                            No puedes acceder a tus clases ni evaluaciones porque tienes un pago pendiente en uno o más de tus grupos inscritos.
                        </p>

                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 w-full p-4 rounded-xl text-left mb-8">
                            <h3 className="font-bold text-red-800 dark:text-red-400 mb-2 uppercase text-xs tracking-wider">Adeudos Detectados:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300 font-medium">
                                {lockedGroupNames.map((name, i) => (
                                    <li key={i}>{name}</li>
                                ))}
                            </ul>
                        </div>

                        <p className="text-sm text-zinc-500 font-medium">
                            Por favor, contacta a tu profesor o administrador escolar para realizar el pago correspondiente y reactivar tu acceso de inmediato.
                        </p>
                    </div>
                ) : children}
            </main>

            <footer className="py-6 text-center text-sm text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
                &copy; {new Date().getFullYear()} Motor Adaptativo. Todos los derechos reservados.
            </footer>
        </div>
    );
}
