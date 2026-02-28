import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Activity, Target } from "lucide-react";
import { es } from "date-fns/locale";
import LiveAdaptiveTable from "./LiveAdaptiveTable";

export default async function AdaptiveEvaluationReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: evaluationId } = await params;

    const evaluation = await prisma.adaptiveEvaluation.findUnique({
        where: { id: evaluationId },
        include: {
            group: {
                include: {
                    members: {
                        include: { student: true },
                        orderBy: { student: { apellidos: 'asc' } }
                    }
                }
            },
            dynamicSessions: {
                include: {
                    student: true,
                    answers: { orderBy: { orderIndex: 'asc' } }
                }
            }
        }
    });

    if (!evaluation) notFound();

    const members = evaluation.group.members;
    const sessions = evaluation.dynamicSessions;

    const totalStudents = members.length;
    const completedSessions = sessions.filter((s: any) => s.status === "COMPLETED");
    const completedCount = completedSessions.length;
    const pendingCount = totalStudents - completedCount;

    // Métricas Adaptativas
    const averageScore = completedCount > 0
        ? completedSessions.reduce((acc: any, s: any) => acc + (s.estimatedScore || 0), 0) / completedCount
        : 0;

    // Distribución de niveles
    let level1Count = 0;
    let level2Count = 0;
    let level3Count = 0;

    completedSessions.forEach((s: any) => {
        if (s.currentLevel === 1) level1Count++;
        else if (s.currentLevel === 2) level2Count++;
        else if (s.currentLevel >= 3) level3Count++;
    });

    // Estado general
    const now = new Date();
    const isActive = now >= evaluation.startDate && now <= evaluation.endDate;
    const isExpired = now > evaluation.endDate;

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Link href={`/dashboard/groups/${evaluation.groupId}`} className="mt-1 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <ArrowLeft size={18} className="text-zinc-600 dark:text-zinc-400" />
                </Link>
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            Reporte Adaptativo
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Motor V1</span>
                        </h1>
                        {isActive ? <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">ACTIVA</span> :
                            isExpired ? <span className="bg-zinc-100 text-zinc-800 text-xs font-bold px-3 py-1 rounded-full">CERRADA</span> :
                                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">PROGRAMADA</span>}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <p><strong className="text-zinc-700 dark:text-zinc-300">Evaluación: </strong> {evaluation.title}</p>
                        <p><strong className="text-zinc-700 dark:text-zinc-300">Objetivo: </strong> {evaluation.targetArea} {evaluation.targetSubarea && `> ${evaluation.targetSubarea}`}</p>
                        <p>Vigencia: {evaluation.startDate.toLocaleDateString()} a {evaluation.endDate.toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Dashboard Analítico Superior */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Promedio Estimado</span>
                        <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{Math.round(averageScore)}%</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Entregas</span>
                        <span className="text-3xl font-black text-green-600 dark:text-green-500">{completedCount} <span className="text-sm font-medium text-zinc-400">/ {totalStudents}</span></span>
                    </div>
                </div>

                {/* Gráfico Visual de Distribución de Niveles (Curva de Aprendizaje) */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-purple-500" /> Distribución de Dominios (Niveles Alcanzados)
                    </h3>
                    {completedCount === 0 ? (
                        <div className="h-24 flex items-center justify-center text-sm text-zinc-500">Aún no hay datos para graficar.</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 text-xs font-bold text-zinc-500 text-right">Avanzado (L3)</div>
                                <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${(level3Count / completedCount) * 100}%` }} />
                                </div>
                                <div className="w-8 text-sm font-bold text-zinc-700 dark:text-zinc-300">{level3Count}</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-20 text-xs font-bold text-zinc-500 text-right">Medio (L2)</div>
                                <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="bg-yellow-500 h-full rounded-full transition-all" style={{ width: `${(level2Count / completedCount) * 100}%` }} />
                                </div>
                                <div className="w-8 text-sm font-bold text-zinc-700 dark:text-zinc-300">{level2Count}</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-20 text-xs font-bold text-zinc-500 text-right">Básico (L1)</div>
                                <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${(level1Count / completedCount) * 100}%` }} />
                                </div>
                                <div className="w-8 text-sm font-bold text-zinc-700 dark:text-zinc-300">{level1Count}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla de Alumnos Detallada */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                    <h2 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Users size={18} className="text-purple-500" /> Detalle por Estudiante
                    </h2>
                </div>
                <LiveAdaptiveTable
                    evaluationId={evaluationId}
                    initialSessions={sessions}
                    members={members}
                    totalQuestions={evaluation.totalQuestions}
                    isActive={isActive}
                />
            </div>
        </div>
    );
}
