"use client";

import { useEffect, useState } from "react";
import { fetchLiveSessionsData } from "./actions";
import { Loader2 } from "lucide-react";

export default function LiveAdaptiveTable({
    evaluationId,
    initialSessions,
    members,
    totalQuestions,
    isActive
}: {
    evaluationId: string,
    initialSessions: any[],
    members: any[],
    totalQuestions: number,
    isActive: boolean
}) {
    const [sessions, setSessions] = useState(initialSessions);
    const [isPolling, setIsPolling] = useState(isActive);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        if (!isPolling) return;

        const interval = setInterval(async () => {
            const result = await fetchLiveSessionsData(evaluationId);
            if (result.sessions) {
                setSessions(result.sessions);
                setLastUpdated(new Date());
            }
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [isPolling, evaluationId]);

    return (
        <div>
            <div className="px-6 py-2 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                    {isPolling ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Actualizando en vivo
                            <Loader2 className="animate-spin text-zinc-400" size={12} />
                        </>
                    ) : (
                        <span className="text-zinc-400">Actualización en vivo pausada/finalizada</span>
                    )}
                </div>
                {isPolling && (
                    <span className="text-[10px] text-zinc-400">
                        Última: {lastUpdated.toLocaleTimeString()}
                    </span>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-3">Alumno</th>
                            <th className="px-6 py-3">Estatus</th>
                            <th className="px-6 py-3 text-center">Nivel Actual</th>
                            <th className="px-6 py-3 text-center">Puntaje Motor</th>
                            <th className="px-6 py-3 text-right">Reactivos Vistos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member: any) => {
                            const session = sessions.find((s: any) => s.studentId === member.student.id);
                            const hasStarted = !!session;
                            const isCompleted = session?.status === "COMPLETED";

                            return (
                                <tr key={member.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                            {member.student.apellidos}, {member.student.nombre}
                                        </div>
                                        <div className="text-xs text-zinc-500">{member.student.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isCompleted ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-xs font-semibold">
                                                Finalizada
                                            </span>
                                        ) : hasStarted ? (
                                            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded text-xs font-semibold relative overflow-hidden">
                                                En Progreso
                                                <div className="absolute bottom-0 left-0 h-[2px] bg-blue-500 animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs font-semibold">
                                                Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {hasStarted ? (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${session.currentLevel >= 3 ? "bg-green-50 border-green-200 text-green-700" :
                                                    session.currentLevel === 2 ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                                                        "bg-red-50 border-red-200 text-red-700"
                                                }`}>
                                                Nivel {session.currentLevel}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {hasStarted ? (
                                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                {Math.round(session.estimatedScore || 0)}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400 font-medium">
                                        {hasStarted ? `${session._count?.answers || session.answers?.length || 0} / ${totalQuestions}` : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
