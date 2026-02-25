"use client";

import { generateExamVersion } from "./actions";
import { useState } from "react";

export default function ExamForm({ availableAreas = [], availableTopics = [] }: { availableAreas?: { name: string, count: number }[], availableTopics?: string[] }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        // Si el usuario desmarcó todas las materias y le da a generar,
        // automáticamente agregaremos todas las materias detectadas para evitar el error.
        const selectedAreas = formData.getAll("areas");
        if (selectedAreas.length === 0 && availableAreas && availableAreas.length > 0) {
            availableAreas.forEach(a => formData.append("areas", a.name));
        }

        try {
            const res = await generateExamVersion(formData);
            if (res?.error) {
                setError(res.error);
            }
        } catch (err: any) {
            setError(err.message || "Error inesperado");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm font-medium">
                    ❌ {error}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título del Examen (Opcional)</label>
                    <input type="text" id="title" name="title" placeholder="Ej. Parcial Álgebra" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="versionCode" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Código Único (Opcional)</label>
                    <input type="text" id="versionCode" name="versionCode" placeholder="Auto-generado si se deja vacío" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="questionCount" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cantidad de Preguntas</label>
                    <input type="number" id="questionCount" name="questionCount" required min="1" max="100" defaultValue="10" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="difficultyLevel" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dificultad Base</label>
                    <select id="difficultyLevel" name="difficultyLevel" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="0">Cualquiera (Aleatorio total)</option>
                        <option value="1">1 - Muy Fácil</option>
                        <option value="2">2 - Fácil</option>
                        <option value="3">3 - Intermedio</option>
                        <option value="4">4 - Difícil</option>
                        <option value="5">5 - Muy Difícil</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        Materias Detectadas en el Banco
                        {availableAreas.length > 0 && (
                            <span className="text-xs font-normal bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                {availableAreas.length} materias
                            </span>
                        )}
                    </label>

                    {availableAreas.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                            {availableAreas.map((area, i) => (
                                <label key={i} className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        name="areas"
                                        value={area.name}
                                        defaultChecked={i === 0} // Check the first one by default 
                                        className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{area.name}</span>
                                        <span className="text-xs text-zinc-500">{area.count} {area.count === 1 ? 'pregunta' : 'preguntas'}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-lg text-sm text-zinc-500 text-center">
                            No hay preguntas en tu banco aún.
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        Subtemas Específicos Detectados
                        {availableTopics.length > 0 && (
                            <span className="text-xs font-normal bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full">
                                {availableTopics.length} detectados
                            </span>
                        )}
                    </label>

                    {availableTopics.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {availableTopics.map((topic, i) => (
                                <label key={i} className="flex items-center gap-3 p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        name="topics"
                                        value={topic}
                                        className="w-4 h-4 text-orange-600 border-zinc-300 rounded focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate" title={topic}>{topic}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-lg text-sm text-zinc-500 text-center">
                            No se detectaron subtemas específicos en tus reactivos.
                        </div>
                    )}
                    <p className="text-xs text-zinc-500">Deja todos desmarcados para incluir preguntas de cualquier subtema dentro de las materias seleccionadas.</p>
                </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Si no hay suficientes preguntas que coincidan con tus filtros, el sistema alertará.</span>
                <button disabled={loading} type="submit" className="px-6 py-2 bg-indigo-600 disabled:opacity-50 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm flex gap-2 items-center">
                    {loading ? "Generando..." : "✨ Generar Plantilla Mágicamente"}
                </button>
            </div>
        </form>
    );
}
