import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getStudentMetrics } from "../../services/studentMetrics";
import { User, Activity, AlertTriangle, CheckCircle, Clock, Target, TrendingUp, TrendingDown, Star } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: studentId } = await params;

    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    if (!sessionId) redirect("/login");

    const currentUser = await prisma.user.findUnique({ where: { id: sessionId } });
    if (!currentUser || currentUser.role === "ALUMNO") redirect("/");

    const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
            groupMemberships: {
                include: { group: true }
            }
        }
    });

    if (!student) notFound();

    const metrics = await getStudentMetrics(studentId);

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shadow-inner">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                            {student.nombre} {student.apellidos}
                        </h1>
                        <p className="text-zinc-500">
                            {student.email} • Nivel {student.level} ({student.xp} XP)
                        </p>
                    </div>
                </div>
                <Link
                    href={`/dashboard/groups/${student.groupMemberships[0]?.groupId || ''}`}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition font-medium"
                >
                    Volver al Grupo
                </Link>
            </div>

            {/* Smart Flags (Risk & Excellence) */}
            {(metrics.flags.isCheatingRisk || metrics.flags.isBurnoutRisk || metrics.flags.isStruggling || metrics.flags.isExcelling) && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {metrics.flags.isExcelling && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 flex items-start gap-4">
                            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg shrink-0">
                                <Star className="text-emerald-600 dark:text-emerald-400" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-900 dark:text-emerald-300">Desempeño Excelente</h3>
                                <p className="text-sm text-emerald-700 dark:text-emerald-500 mt-1">El alumno domina los temas con alta precisión (&gt;85%).</p>
                            </div>
                        </div>
                    )}
                    {metrics.flags.isStruggling && (
                        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-xl p-4 flex items-start gap-4">
                            <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg shrink-0">
                                <TrendingDown className="text-orange-600 dark:text-orange-400" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-orange-900 dark:text-orange-300">Dificultad Detectada</h3>
                                <p className="text-sm text-orange-700 dark:text-orange-500 mt-1">Precisión global muy baja (&lt;40%). Sugiere tutoría.</p>
                            </div>
                        </div>
                    )}
                    {metrics.flags.isBurnoutRisk && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 flex items-start gap-4">
                            <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg shrink-0">
                                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-900 dark:text-red-300">Riesgo de Frustración</h3>
                                <p className="text-sm text-red-700 dark:text-red-500 mt-1">Múltiples sesiones adaptativas fallidas consecutivamente.</p>
                            </div>
                        </div>
                    )}
                    {metrics.flags.isCheatingRisk && (
                        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl p-4 flex items-start gap-4">
                            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg shrink-0">
                                <Activity className="text-purple-600 dark:text-purple-400" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-purple-900 dark:text-purple-300">Patrón Inusual (Anti-Trampa)</h3>
                                <p className="text-sm text-purple-700 dark:text-purple-500 mt-1">Altísimo porcentaje de aciertos con tiempos de respuesta muy rápidos (&lt;4s).</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Core Metrics Grid */}
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Precisión Global"
                    value={`${metrics.overallAccuracy}%`}
                    icon={<Target size={24} className="text-blue-500" />}
                    trend={metrics.overallAccuracy >= 60 ? 'good' : 'bad'}
                />
                <MetricCard
                    title="Tiempo Prom. / Preg"
                    value={metrics.avgTimePerQuestionMs > 0 ? `${(metrics.avgTimePerQuestionMs / 1000).toFixed(1)}s` : 'N/A'}
                    icon={<Clock size={24} className="text-amber-500" />}
                    subtext="Velocidad de respuesta"
                />
                <MetricCard
                    title="Materia Fuerte"
                    value={metrics.strongestArea || 'Ninguna'}
                    icon={<TrendingUp size={24} className="text-emerald-500" />}
                />
                <MetricCard
                    title="Área de Oportunidad"
                    value={metrics.weakestArea || 'Ninguna'}
                    icon={<TrendingDown size={24} className="text-rose-500" />}
                />
            </div>

            {/* Detailed Performance Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex justify-between items-center">
                    <h2 className="font-bold text-zinc-900 dark:text-white">Rendimiento por Materia</h2>
                </div>
                {metrics.performanceByArea.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                        No hay suficientes datos de respuestas aún para generar el reporte por área.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Materia / Área</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Intentos</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest justify-center">Precisión</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Velocidad Promedio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.performanceByArea.map((area, idx) => (
                                    <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">{area.area}</td>
                                        <td className="px-6 py-4 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                                            {area.totalAttempted} <span className="text-xs text-zinc-400">({area.totalCorrect} correctas)</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${area.accuracy >= 60 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${area.accuracy}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                                                    {Math.round(area.accuracy)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums text-zinc-500">
                                            {area.avgTimeMs > 0 ? `${(area.avgTimeMs / 1000).toFixed(1)}s` : '--'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Activity Stats Summary */}
            <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-wrap gap-8 justify-around text-center">
                <div>
                    <span className="block text-2xl font-black text-zinc-900 dark:text-white tabular-nums">{student.currentStreak} 🔥</span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Racha Actual</span>
                </div>
                <div>
                    <span className="block text-2xl font-black text-zinc-900 dark:text-white tabular-nums">{metrics.totalPracticeSessions}</span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sesiones de Práctica</span>
                </div>
                <div>
                    <span className="block text-2xl font-black text-zinc-900 dark:text-white tabular-nums">{metrics.totalEvaluations}</span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Simuladores (Exámenes)</span>
                </div>
                <div>
                    <span className="block text-xl font-bold text-zinc-700 dark:text-zinc-300">
                        {student.lastActiveDate ? format(new Date(student.lastActiveDate), "dd MMM, yyyy", { locale: es }) : "Nunca"}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Última Actividad</span>
                </div>
            </div>

        </div>
    );
}

function MetricCard({ title, value, icon, subtext, trend }: { title: string, value: string | number, icon: React.ReactNode, subtext?: string, trend?: 'good' | 'bad' | 'neutral' }) {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    {icon}
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-1 tabular-nums 
                    ${trend === 'good' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'bad' ? 'text-rose-600 dark:text-rose-400' : ''}">
                    {value}
                </h3>
                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{title}</p>
                {subtext && <p className="text-xs text-zinc-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}
