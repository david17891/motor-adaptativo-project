import { BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatDistanceToNow, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { cookies } from "next/headers";

export default async function StudentDashboard() {
    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    if (!studentId) {
        return <div className="p-8 text-center text-red-500 font-bold">Sesión expirada. Por favor, reingresa.</div>;
    }

    // 1. Obtener al alumno real usando su ID en la cookie
    const currentUser = await prisma.user.findUnique({
        where: { id: studentId, role: "ALUMNO" },
        include: { groupMemberships: true }
    });

    if (!currentUser) {
        return <div className="p-8 text-center text-red-500 font-bold">Cuenta de alumno no encontrada o inválida.</div>;
    }

    const unassignedGroupsIds = currentUser.groupMemberships.map((gm: any) => gm.groupId);

    // 2. Extraer TODAS las evaluaciones asignadas a esos grupos
    const myEvaluations = await prisma.evaluation.findMany({
        where: { groupId: { in: unassignedGroupsIds } },
        include: {
            examVersion: true,
            results: { where: { studentId: currentUser.id } }
        },
        orderBy: { endDate: 'asc' }
    });

    // 2.5 Extraer Evaluaciones Adaptativas
    const myAdaptiveEvaluations = await prisma.adaptiveEvaluation.findMany({
        where: { groupId: { in: unassignedGroupsIds } },
        include: {
            dynamicSessions: { where: { studentId: currentUser.id } }
        },
        orderBy: { endDate: 'asc' }
    });

    const pendingEvals = [];
    const pastEvals = [];
    const now = new Date();

    for (const ev of myEvaluations) {
        const hasFinished = ev.results.some((r: any) => r.completedAt !== null);

        if (hasFinished) {
            const completedResult = ev.results.find((r: any) => r.completedAt !== null);
            pastEvals.push({
                id: completedResult!.id, // We'll link to result breakdown
                evalId: ev.id,
                title: ev.examVersion.title,
                score: completedResult!.score !== null ? `${completedResult!.score} / 100` : "Pendiente",
                passed: completedResult!.score !== null ? completedResult!.score >= 60 : false,
                date: formatDistanceToNow(completedResult!.completedAt!, { addSuffix: true, locale: es })
            });
        } else {
            // Is it active right now?
            const isCurrentlyActive = ev.startDate <= now && ev.endDate >= now;
            const isMissed = ev.endDate < now;

            if (isCurrentlyActive) {
                const inProgressResult = ev.results.find((r: any) => r.completedAt === null);

                pendingEvals.push({
                    id: ev.id,
                    title: ev.examVersion.title,
                    code: ev.examVersion.versionCode,
                    deadline: formatDistanceToNow(ev.endDate, { addSuffix: true, locale: es }),
                    status: inProgressResult ? "in_progress" : "open"
                });
            } else if (isMissed) {
                pastEvals.push({
                    id: `missed-${ev.id}`,
                    evalId: ev.id,
                    title: ev.examVersion.title,
                    score: "Missed",
                    passed: false,
                    date: "Venció " + formatDistanceToNow(ev.endDate, { addSuffix: true, locale: es })
                });
            }
        }
    }

    // Mezclar las adaptativas en pendingEvals o pastEvals
    for (const aEv of myAdaptiveEvaluations) {
        const session = aEv.dynamicSessions[0]; // El alumno solo tiene 1 sesión por evaluación
        const isCompleted = session?.status === "COMPLETED";

        if (isCompleted) {
            pastEvals.push({
                id: session.id, // ID de la sesión para ver resultados
                evalId: aEv.id,
                title: aEv.title,
                score: `${Math.round(session.estimatedScore || 0)} / 100`, // Aproximado
                passed: (session.estimatedScore || 0) >= 60,
                date: formatDistanceToNow(session.completedAt!, { addSuffix: true, locale: es }),
                isAdaptive: true
            });
        } else {
            const isCurrentlyActive = aEv.startDate <= now && aEv.endDate >= now;
            const isMissed = aEv.endDate < now;

            if (isCurrentlyActive) {
                pendingEvals.push({
                    id: aEv.id,
                    title: aEv.title,
                    code: `${aEv.targetArea} (Multi-nivel)`,
                    deadline: formatDistanceToNow(aEv.endDate, { addSuffix: true, locale: es }),
                    status: session ? "in_progress" : "open",
                    isAdaptive: true
                });
            } else if (isMissed) {
                pastEvals.push({
                    id: `missed-adaptive-${aEv.id}`,
                    evalId: aEv.id,
                    title: aEv.title,
                    score: "Missed",
                    passed: false,
                    date: "Venció " + formatDistanceToNow(aEv.endDate, { addSuffix: true, locale: es }),
                    isAdaptive: true
                });
            }
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-600 dark:bg-indigo-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 w-full md:w-2/3">
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Hola de Nuevo, {currentUser.nombre} 👋</h1>
                    <p className="text-indigo-100 text-lg leading-relaxed">
                        Tienes <strong className="text-white bg-indigo-500 dark:bg-indigo-800 px-2 rounded-md">{pendingEvals.length} {pendingEvals.length === 1 ? 'evaluación' : 'evaluaciones'}</strong> pendientes que debes completar en los próximos días. ¡Tómate tu tiempo y lee con mucha atención las instrucciones!
                    </p>
                </div>
                <div className="absolute -right-16 -bottom-16 opacity-20 pointer-events-none">
                    <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grad-cap"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                </div>
            </div>

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
                    <div className="grid gap-4 md:grid-cols-2">
                        {pendingEvals.map(ev => (
                            <div key={ev.id} className="bg-white dark:bg-zinc-950 border-2 border-orange-200 dark:border-orange-900/40 rounded-xl p-5 shadow-sm flex flex-col hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded ${ev.status === "in_progress"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                                        : ev.isAdaptive ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" : "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                                        }`}>
                                        {ev.status === "in_progress" ? "EN PROGRESO" : ev.isAdaptive ? "MOTOR ADAPTATIVO" : `FIJA: ${ev.code}`}
                                    </span>
                                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                        ⏱️ Vence {ev.deadline}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-zinc-100">{ev.title}</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex-grow">
                                    {ev.isAdaptive
                                        ? "Esta evaluación ajustará dinámicamente el nivel de dificultad de las preguntas en base a tus respuestas en tiempo real."
                                        : "Esta prueba evalúa tu conocimiento en diversas áreas. Asegúrate de tener conexión a internet estable."}
                                </p>

                                <Link href={ev.isAdaptive ? `/student/adaptive/${ev.id}` : `/student/evals/${ev.id}`} className={`mt-auto px-4 py-2 text-white font-bold rounded-lg text-center transition-colors shadow ${ev.status === "in_progress"
                                    ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    : ev.isAdaptive ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700" : "bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                                    }`}>
                                    {ev.status === "in_progress" ? "Reanudar Evaluación" : "Iniciar Evaluación"}
                                </Link>
                            </div>
                        ))}
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
