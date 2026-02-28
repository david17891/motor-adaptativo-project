import { BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatDistanceToNow, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { cookies } from "next/headers";
import { logoutStudent } from "./login/actions";
import PracticeForm from "./practice/PracticeForm";
import { deletePracticeSession } from "./practice/actions";
import StudentAnalytics from "./components/StudentAnalytics";
import { getStudentEvaluations } from "./services/evaluations";

export default async function StudentDashboard() {
    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    if (!studentId) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Acceso Denegado</h2>
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800 max-w-md">
                    <p className="font-medium">No se encontró una sesión de alumno activa.</p>
                    <p className="text-sm mt-2 opacity-80">
                        Esta sección es exclusiva para estudiantes. Si eres administrador, por favor regresa al <Link href="/dashboard" className="underline font-bold">Dashboard Principal</Link>.
                    </p>
                </div>
            </div>
        );
    }

    // 1. Obtener al alumno real usando su ID en la cookie
    const currentUser = await prisma.user.findUnique({
        where: { id: studentId, role: "ALUMNO" },
        include: { groupMemberships: true }
    });

    if (!currentUser) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Cuenta Inválida</h2>
                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-4 rounded-lg border border-orange-200 dark:border-orange-800 max-w-md">
                    <p className="font-medium">La cuenta asociada a esta sesión no corresponde a un alumno válido.</p>
                    <form action={logoutStudent} className="mt-4">
                        <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors">
                            Cerrar Sesión / Volver al Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const { pendingEvals, pastEvals, areasObj } = await getStudentEvaluations(currentUser);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-600 dark:bg-indigo-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 w-full md:w-2/3">
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Hola de Nuevo, {currentUser.nombre} 👋</h1>
                    <p className="text-indigo-100 text-lg leading-relaxed mb-2">
                        Tienes <strong className="text-white bg-indigo-500 dark:bg-indigo-800 px-2 rounded-md">{pendingEvals.length} {pendingEvals.length === 1 ? 'evaluación' : 'evaluaciones'}</strong> pendientes que debes completar en los próximos días. ¡Tómate tu tiempo y lee con mucha atención las instrucciones!
                    </p>

                    {/* Gamification Stats */}
                    <div className="flex flex-wrap items-center gap-4 mt-6">
                        <div className="flex items-center gap-2 bg-white/20 dark:bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl text-white shadow-inner" title="Racha de días activos">
                            <span className="text-2xl drop-shadow-md">🔥</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider opacity-80 font-black">Racha Activa</span>
                                <span className="font-bold text-xl leading-none">{currentUser.currentStreak || 0} <span className="text-sm font-medium opacity-90">Días</span></span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white/20 dark:bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl text-white shadow-inner" title="Puntos de Experiencia Totales">
                            <span className="text-2xl drop-shadow-md">⭐</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider opacity-80 font-black">Experiencia</span>
                                <span className="font-bold text-xl leading-none">{currentUser.xp || 0} <span className="text-sm font-medium opacity-90">XP</span></span>
                            </div>
                        </div>
                    </div>
                    <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grad-cap"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                </div>
            </div>

            {/* Metadatos de Dominio y Analítica */}
            <StudentAnalytics studentId={currentUser.id} />

            {/* Formulario de Práctica Libre */}
            <PracticeForm areasObj={areasObj} />

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <AlertCircle className="text-orange-500" />
                    Pendientes de Resolver
                </h2>

                {pendingEvals.length === 0 ? (
                    <div className="bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
                        No tienes ninguna evaluación pendiente en este momento. ¡Sigue así! 🎉
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {pendingEvals.map(ev => {
                            const isProgress = ev.status === "in_progress";
                            const isPractice = ev.isPractice;
                            const isAdaptive = ev.isAdaptive;

                            let borderColor = "border-orange-200 dark:border-orange-900/40 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-orange-500/10";
                            let badgeColor = "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
                            let buttonColor = "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white hover:shadow-zinc-500/20";

                            if (isProgress) {
                                borderColor = "border-blue-300 dark:border-blue-900/60 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-blue-500/10";
                                badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
                                buttonColor = "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500 hover:shadow-blue-600/30";
                            } else if (isPractice) {
                                borderColor = "border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-500/10";
                                badgeColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300";
                                buttonColor = "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:shadow-emerald-600/30";
                            } else if (isAdaptive) {
                                borderColor = "border-purple-200 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-purple-500/10";
                                badgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
                                buttonColor = "bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-600 dark:hover:bg-purple-500 hover:shadow-purple-600/30";
                            }

                            return (
                                <div key={ev.id} className={`bg-white dark:bg-zinc-950 border-2 rounded-2xl p-6 shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${borderColor}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`font-mono text-[10px] tracking-wide font-bold px-2.5 py-1 rounded-md ${badgeColor}`}>
                                            {isProgress ? "EN PROGRESO" : isPractice ? "PRACTICA LIBRE" : isAdaptive ? "MOTOR ADAPTATIVO" : `FIJA: ${ev.code}`}
                                        </span>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950 px-2.5 py-1 rounded-full">
                                                ⏱️ {ev.deadline === "Sin límite" ? "Sin límite" : `Vence ${ev.deadline}`}
                                            </span>
                                            {ev.durationMinutes && (
                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full">
                                                    ⏲️ Duración: {ev.durationMinutes} min
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-extrabold text-xl mb-2 text-zinc-900 dark:text-zinc-50 leading-tight">{ev.title}</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex-grow leading-relaxed">
                                        {ev.isPractice
                                            ? "Sesión autónoma. Refuerza tus áreas de oportunidad sin afectar tu calificación final."
                                            : ev.isAdaptive
                                                ? "Esta evaluación ajustará dinámicamente el nivel de dificultad de las preguntas en base a tus respuestas en tiempo real."
                                                : "Esta prueba evalúa tu conocimiento en diversas áreas. Asegúrate de tener conexión a internet estable."}
                                    </p>

                                    <div className="mt-auto flex gap-3">
                                        <Link href={ev.isPractice ? `/student/practice/${ev.id}` : ev.isAdaptive ? `/student/adaptive/${ev.id}` : `/student/evals/${ev.id}`} className={`flex-1 px-4 py-2.5 font-bold rounded-xl text-center transition-all ${buttonColor}`}>
                                            {isProgress ? (ev.isPractice ? "Reanudar Práctica" : "Reanudar") : (ev.isPractice ? "Iniciar Práctica" : "Iniciar")}
                                        </Link>

                                        {ev.isPractice && (
                                            <form action={async () => {
                                                "use server";
                                                await deletePracticeSession(ev.id);
                                            }}>
                                                <button
                                                    type="submit"
                                                    title="Eliminar Práctica"
                                                    className="px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 rounded-xl font-bold transition-colors flex items-center justify-center h-full border border-red-100 dark:border-red-900/50"
                                                >
                                                    <AlertCircle size={20} className="rotate-45" />
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            <div className="space-y-4 pt-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <BookOpen className="text-emerald-600 dark:text-emerald-500" />
                    Cursos y Evaluaciones Finalizadas
                </h2>

                {pastEvals.length === 0 ? (
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 shadow-sm">
                        Todavía no tienes calificaciones históricas.
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Evaluación</th>
                                    <th className="px-5 py-3 font-medium">Calificación</th>
                                    <th className="px-5 py-3 font-medium text-right">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pastEvals.map(pe => (
                                    <tr key={pe.id} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {pe.score === "Missed" ? <AlertCircle size={18} className="text-zinc-500" /> : pe.passed ? <CheckCircle2 size={18} className="text-green-500" /> : <AlertCircle size={18} className="text-red-500" />}
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{pe.title}</span>
                                                    <span className="text-xs text-zinc-400 capitalize">{pe.date}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`font-bold px-2 py-1 rounded-md text-xs ${pe.score === "Missed" ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400' : pe.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                                                {pe.score}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {pe.score === "Missed" ? (
                                                <span className="text-zinc-400 font-medium text-xs">Expiró</span>
                                            ) : pe.isAdaptive ? (
                                                <span className="text-zinc-500 italic text-xs">Puntaje Motor</span>
                                            ) : (
                                                <Link href={`/student/results/${pe.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs cursor-pointer">
                                                    Ver Reporte Completo
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
