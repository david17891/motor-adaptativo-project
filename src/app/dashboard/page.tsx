import { currentUser } from "@clerk/nextjs/server";
import { ChevronRight, GraduationCap, Building2, FileText, Users as UsersIcon, Percent } from "lucide-react";
import Link from 'next/link';
import prisma from "@/lib/prisma";
import { ReactNode } from "react";
import { getGlobalStudentAlerts } from "./students/metrics.actions";
import { AlertCircle, Clock, Zap } from "lucide-react";

function MetricCard({ title, value, description, icon, trend }: { title: string, value: string | number, description?: string, icon: ReactNode, trend?: string }) {
    return (
        <div className="bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all translate-x-4 -translate-y-4 scale-150 group-hover:scale-110 duration-500 text-blue-600 dark:text-blue-400">
                {icon}
            </div>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{title}</h3>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
                <p className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{value}</p>
                {trend && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{trend}</span>}
            </div>
            {description && <p className="text-xs text-zinc-400 mt-3 font-medium relative z-10">{description}</p>}
        </div>
    );
}

export default async function DashboardPage() {
    const user = await currentUser();

    // Fetch real stats
    const [tenantsCount, examsCount, studentsCount, results] = await Promise.all([
        prisma.tenant.count(),
        prisma.examVersion.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'ALUMNO' } }),
        prisma.result.findMany({ select: { score: true }, where: { score: { not: null } } })
    ]);

    const globalAvg = results.length > 0
        ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length)
        : "N/A";

    const alerts = await getGlobalStudentAlerts();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Bienvenido, {user?.firstName || "Usuario"} 👋
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Resumen de actividad para tu sección del Motor Adaptativo.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Sedes Activas" value={tenantsCount.toString()} description="Instituciones u organizaciones" icon={<Building2 size={24} strokeWidth={1.5} />} trend="Operativo" />
                <MetricCard title="Exámenes Activos" value={examsCount.toString()} description="Versiones Listas para Evaluar" icon={<FileText size={24} strokeWidth={1.5} />} />
                <MetricCard title="Estudiantes" value={studentsCount.toString()} description="Matrícula Total Global" icon={<UsersIcon size={24} strokeWidth={1.5} />} />
                <MetricCard title="Rendimiento Global" value={globalAvg === "N/A" ? "N/A" : `${globalAvg}%`} description="Promedio Histórico" icon={<Percent size={24} strokeWidth={1.5} />} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Evaluaciones Recientes</h2>
                    <div className="text-sm text-zinc-500 text-center py-8 border-2 border-dashed rounded-lg border-zinc-100 dark:border-zinc-900">
                        No hay evaluaciones activas actualmente.
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={18} /> Sistema de Alertas Tempranas
                    </h2>

                    {alerts.length === 0 ? (
                        <div className="text-sm text-zinc-500 text-center py-8 border-2 border-dashed rounded-lg border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/20">
                            🎉 Todo en orden. No hay estudiantes en riesgo detectados.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((alert, i) => (
                                <div key={i} className={`p-4 rounded-lg flex gap-3 border ${alert.severity === "HIGH"
                                        ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30"
                                        : "bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30"
                                    }`}>
                                    <div className="mt-0.5">
                                        {alert.type === "INACTIVITY" ? (
                                            <Clock className={alert.severity === "HIGH" ? "text-red-600" : "text-orange-600"} size={16} />
                                        ) : (
                                            <Zap className={alert.severity === "HIGH" ? "text-red-600" : "text-orange-600"} size={16} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/dashboard/students/${alert.studentId}`} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:underline">
                                                {alert.studentName}
                                            </Link>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${alert.severity === "HIGH"
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                                                }`}>
                                                {alert.severity}
                                            </span>
                                        </div>
                                        <p className="text-xs mt-1 text-zinc-700 dark:text-zinc-300 font-medium">
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <GraduationCap className="text-blue-600 dark:text-blue-400" /> Vista de Alumno
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm max-w-lg">
                        Descubre cómo verán los estudiantes sus evaluaciones programadas. El entorno del estudiante está minimizado para reducir distracciones y focar en lo académico.
                    </p>
                </div>
                <Link href="/student" target="_blank" className="px-6 py-3 bg-blue-600 text-white dark:bg-blue-600 font-bold rounded-xl shadow hover:bg-blue-700 transition whitespace-nowrap">
                    Ir al Portal Estudiantil
                </Link>
            </div>
        </div>
    );
}
