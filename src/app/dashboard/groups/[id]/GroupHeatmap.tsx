import React from "react";
import prisma from "@/lib/prisma";
import { AlertCircle, Target, Beaker, CheckCircle2 } from "lucide-react";

export default async function GroupHeatmap({ groupId }: { groupId: string }) {
    // 1. Obtener a todos los alumnos vinculados al grupo
    const groupMembers = await prisma.groupMember.findMany({
        where: { groupId },
        select: { studentId: true }
    });

    const studentIds = groupMembers.map(m => m.studentId);

    if (studentIds.length === 0) {
        return (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 shadow-sm mt-6">
                Este grupo no tiene estudiantes inscritos aún.
            </div>
        );
    }

    // 2. Extraer respuestas de exámenes fijos de todos los alumnos
    const resultAnswers = await prisma.resultAnswer.findMany({
        where: {
            result: { studentId: { in: studentIds } },
            // Opcional: Podríamos filtrar que solo sean las evaluaciones de este grupo, 
            // pero si queremos el nivel general de los alumnos del grupo en todo su historial, quitamos ese filtro.
            // Para mayor precisión al "conocimiento del grupo", filtraremos por *cualquier* examen que haya hecho el alumno.
        },
        include: {
            question: { select: { area: true, subarea: true } }
        }
    });

    // 3. Extraer respuestas adaptativas/práctica
    const dynamicAnswers = await prisma.dynamicSessionAnswer.findMany({
        where: {
            dynamicSession: { studentId: { in: studentIds } }
        },
        include: {
            question: { select: { area: true, subarea: true } }
        }
    });

    const totalRespuestas = resultAnswers.length + dynamicAnswers.length;

    if (totalRespuestas === 0) {
        return (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 mt-6">
                <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 rounded-xl flex items-center justify-center mb-4">
                        <Beaker size={24} />
                    </div>
                    <h3 className="text-zinc-900 dark:text-zinc-100 font-bold mb-1">Sin Interacciones Aún</h3>
                    <p className="text-zinc-500 text-sm">Los estudiantes de este grupo necesitan responder evaluaciones o practicar para poder generar el diagnóstico grupal.</p>
                </div>
            </div>
        );
    }

    // --- Lógica de Agrupación por Área/Subárea ---
    // Record: { "Matemáticas - Álgebra": { total: 100, correct: 60 } }
    const statsMap: Record<string, { total: number, correct: number, area: string, subarea: string }> = {};

    const processItem = (area: string, subarea: string | null, isCorrect: boolean) => {
        const key = subarea ? `${area} - ${subarea}` : area;
        if (!statsMap[key]) {
            statsMap[key] = { total: 0, correct: 0, area, subarea: subarea || area };
        }
        statsMap[key].total++;
        if (isCorrect) statsMap[key].correct++;
    };

    resultAnswers.forEach(ans => processItem(ans.question.area, ans.question.subarea, ans.isCorrect));
    dynamicAnswers.forEach(ans => processItem(ans.question.area, ans.question.subarea, ans.isCorrect));

    // Formatear a Array y calcular exactitud
    const heatData = Object.values(statsMap)
        .filter(item => item.total >= 3) // Evitar 100% o 0% porque solo un alumno hizo una sola pregunta
        .map(item => ({
            ...item,
            accuracy: Math.round((item.correct / item.total) * 100)
        }))
        .sort((a, b) => b.accuracy - a.accuracy); // Ordenar de mejor a peor

    const fuertes = heatData.filter(d => d.accuracy >= 75);
    const regulares = heatData.filter(d => d.accuracy >= 50 && d.accuracy < 75);
    const criticos = heatData.filter(d => d.accuracy < 50);

    return (
        <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                    <Target className="text-indigo-600" /> Diagnóstico de Cohorte
                </h2>
                <p className="text-sm text-zinc-500">
                    Basado en <b>{totalRespuestas} reactivos</b> contestados históricamente por los {studentIds.length} alumnos de este grupo. Úsalo para saber qué repasar en el pizarrón.
                </p>
            </div>

            {/* ZONA VERDE: Dominio */}
            {fuertes.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-5">
                    <h3 className="text-emerald-800 dark:text-emerald-400 font-bold mb-3 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Alta Comprensión (&ge; 75%)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {fuertes.map((h, i) => (
                            <div key={i} className="bg-white dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 flex items-center gap-3 shadow-sm">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{h.subarea}</span>
                                <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2 py-0.5 rounded-full">{h.accuracy}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ZONA AMARILLA: Regular */}
            {regulares.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-5">
                    <h3 className="text-amber-800 dark:text-amber-400 font-bold mb-3 flex items-center gap-2">
                        <AlertCircle size={16} /> En Desarrollo (50% - 74%)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {regulares.map((h, i) => (
                            <div key={i} className="bg-white dark:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 flex items-center gap-3 shadow-sm">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{h.subarea}</span>
                                <span className="bg-amber-100 text-amber-700 font-bold text-xs px-2 py-0.5 rounded-full">{h.accuracy}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ZONA ROJA: Alerta Médica */}
            {criticos.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-5">
                    <h3 className="text-red-800 dark:text-red-400 font-bold mb-3 flex items-center gap-2">
                        <AlertCircle size={16} className="rotate-180" /> Atención Urgente (&lt; 50%)
                    </h3>
                    <p className="text-xs text-red-600 dark:text-red-400/80 mb-3">La mayoría de la clase falla en estos conceptos sistemáticamente.</p>
                    <div className="flex flex-wrap gap-2">
                        {criticos.map((h, i) => (
                            <div key={i} className="bg-white dark:bg-red-900/60 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 flex items-center gap-3 shadow-sm">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{h.subarea}</span>
                                <span className="bg-red-100 text-red-700 font-bold text-xs px-2 py-0.5 rounded-full">{h.accuracy}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {heatData.length === 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 shadow-sm mt-6">
                    Los estudiantes han respondido muy pocas preguntas aún como para generar un mapa estadísticamente relevante.
                </div>
            )}
        </div>
    );
}
