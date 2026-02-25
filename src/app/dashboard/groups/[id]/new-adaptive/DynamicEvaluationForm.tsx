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

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            await addAdaptiveEvaluationToGroup(formData);
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
                    defaultValue={10}
                    min={1}
                    max={50}
                    required
                    className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fecha de Inicio</label>
                    <input type="date" name="startDate" defaultValue={today} required className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fecha de Cierre</label>
                    <input type="date" name="endDate" defaultValue={nextWeekFormatted} required className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500" />
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <Link href={`/dashboard/groups/${groupId}`} className="px-6 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-semibold">
                    Cancelar
                </Link>
                <button disabled={loading} type="submit" className="px-6 py-2 bg-purple-600 disabled:opacity-50 hover:bg-purple-700 text-white rounded-lg transition-colors font-bold shadow-sm flex items-center gap-2">
                    {loading ? "Programando..." : "⚡ Programar Dinámica"}
                </button>
            </div>
        </form>
    );
}
