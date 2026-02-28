"use client";

import { useState } from "react";
import Link from "next/link";
import { addAdaptiveEvaluationToGroup } from "../actions";

export default function DynamicEvaluationForm({
    groupId,
    uniqueAreas,
    availableTopics,
    today,
    nextWeekFormatted
}: {
    groupId: string;
    uniqueAreas: string[];
    availableTopics: string[];
    today: string;
    nextWeekFormatted: string;
}) {
    const [loading, setLoading] = useState(false);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [duration, setDuration] = useState<number | "">("");

    const calculateTime = (minsPerQuestion: number) => {
        setDuration(Math.ceil(totalQuestions * minsPerQuestion));
    };

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = await addAdaptiveEvaluationToGroup(formData);
            if (result && result.error) {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Hubo un error al programar la evaluación dinámica.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="groupId" value={groupId} />

            <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Título de la Evaluación</label>
                <input
                    type="text"
                    name="title"
                    placeholder="Ej. Examen Mensual de Refuerzo Adaptativo"
                    required
                    className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div className="space-y-4 border rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Área Objetivo Mágica</label>
                        <select name="targetArea" required className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 shadow-sm focus:ring-2 focus:ring-purple-500">
                            <option value="">-- Selecciona un Área --</option>
                            {uniqueAreas.map(area => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">
                            El motor solo preguntará reactivos de esta área.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                            Aislar Subtemas Inteligentes (Semanas, Parciales)
                            {availableTopics.length > 0 && (
                                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full">
                                    {availableTopics.length} detectados
                                </span>
                            )}
                        </label>

                        {availableTopics.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                                {availableTopics.map((topic, i) => (
                                    <label key={i} className="flex items-center gap-3 p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shadow-sm">
                                        <input
                                            type="checkbox"
                                            name="targetSubarea"
                                            value={topic}
                                            className="w-4 h-4 text-purple-600 border-zinc-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate font-medium" title={topic}>{topic}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-lg text-sm text-zinc-500 text-center bg-white dark:bg-zinc-950">
                                No se detectaron subtemas específicos.
                            </div>
                        )}
                        <p className="text-xs text-zinc-500 leading-tight">
                            Deja todos desmarcados para incluir preguntas de cualquier subtema que pertenezca al área seleccionada.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total de Reactivos Adaptativos</label>
                <p className="text-xs text-zinc-500">Cuántas preguntas resolverán antes de que el Motor les dictamine una calificación final.</p>
                <input
                    type="number"
                    name="totalQuestions"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 0)}
                    min={1}
                    max={50}
                    required
                    className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500 font-bold"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Duración de la Evaluación (Minutos)</label>
                <p className="text-xs text-zinc-500">Tiempo límite para completar la evaluación. Vacío para sin límite.</p>
                <input
                    type="number"
                    name="durationMinutes"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value === "" ? "" : parseInt(e.target.value))}
                    placeholder="Ej. 45"
                    min={1}
                    className="w-full px-4 py-2 border-2 rounded-lg bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500 font-bold"
                />

                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => calculateTime(1)}
                        className="text-[10px] font-bold px-2 py-1 border rounded bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        1 min/preg ({totalQuestions}m)
                    </button>
                    <button
                        type="button"
                        onClick={() => calculateTime(2)}
                        className="text-[10px] font-bold px-2 py-1 border rounded bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-purple-200 text-purple-600"
                    >
                        2 min/preg ({totalQuestions * 2}m)
                    </button>
                    <button
                        type="button"
                        onClick={() => calculateTime(1.6)}
                        className="text-[10px] font-black px-2 py-1 border-2 border-orange-200 text-orange-600 rounded bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 transition-colors"
                    >
                        ⭐ UABC ({Math.ceil(totalQuestions * 1.6)}m)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fecha de Inicio</label>
                    <input type="date" name="startDate" defaultValue={today} required className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fecha de Cierre</label>
                    <input type="date" name="endDate" defaultValue={nextWeekFormatted} required className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500" />
                </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                <Link href={`/dashboard/groups/${groupId}`} className="w-full sm:w-auto px-6 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-semibold text-center order-2 sm:order-1">
                    Cancelar
                </Link>
                <button disabled={loading} type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 disabled:opacity-50 hover:bg-purple-700 text-white rounded-xl transition-all font-bold shadow-md active:scale-95 flex items-center justify-center gap-2 order-1 sm:order-2">
                    {loading ? "Programando..." : "⚡ Programar Dinámica"}
                </button>
            </div>
        </form>
    );
}
