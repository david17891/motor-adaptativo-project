"use client";

import { generateExamVersion, generateExamWithAIPrompt } from "./actions";
import { useState } from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";

export default function ExamForm({ availableAreas = [], availableTopics = [] }: { availableAreas?: { name: string, count: number }[], availableTopics?: string[] }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [mode, setMode] = useState<"manual" | "ai">("manual");
    const [prompt, setPrompt] = useState("");

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            let res;
            if (mode === "ai") {
                if (!prompt.trim()) {
                    setError("Por favor describe el examen que quieres generar.");
                    setLoading(false);
                    return;
                }
                res = await generateExamWithAIPrompt(prompt, availableTopics || []);
            } else {
                // Si el usuario desmarcó todas las materias y le da a generar,
                // automáticamente agregaremos todas las materias detectadas para evitar el error.
                const selectedAreas = formData.getAll("areas");
                if (selectedAreas.length === 0 && availableAreas && availableAreas.length > 0) {
                    availableAreas.forEach(a => formData.append("areas", a.name));
                }
                res = await generateExamVersion(formData);
            }

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
        <div className="space-y-6">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${mode === "manual" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"}`}
                >
                    <SlidersHorizontal size={16} /> Configuración Manual
                </button>
                <button
                    type="button"
                    onClick={() => setMode("ai")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${mode === "ai" ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"}`}
                >
                    <Sparkles size={16} /> Asistente IA
                </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm font-medium">
                        ❌ {error}
                    </div>
                )}

                {mode === "manual" ? (
                    <>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {availableAreas.map((area, i) => (
                                            <label key={i} className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    name="areas"
                                                    value={area.name}
                                                    defaultChecked={i === 0} // Check the first one by default 
                                                    className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{area.name}</span>
                                                    <span className="text-[10px] text-zinc-500">{area.count} {area.count === 1 ? 'pregunta' : 'preguntas'}</span>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                        {availableTopics.map((topic, i) => (
                                            <label key={i} className="flex items-center gap-3 p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    name="topics"
                                                    value={topic}
                                                    className="w-4 h-4 text-orange-600 border-zinc-300 rounded focus:ring-orange-500 flex-shrink-0"
                                                />
                                                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate" title={topic}>{topic}</span>
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
                    </>
                ) : (
                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-xl p-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="prompt" className="text-sm font-medium text-purple-900 dark:text-purple-300 flex items-center gap-2 mb-2">
                                    <Sparkles size={16} /> Describe tu examen ideal en lenguaje natural
                                </label>
                                <textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ej. Necesito un examen parcial de Matemáticas sobre Ecuaciones de 1er Grado con 15 preguntas difíciles."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white dark:bg-indigo-950/20 border border-purple-300 dark:border-purple-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 text-zinc-800 dark:text-zinc-200 placeholder-purple-300 dark:placeholder-purple-600 resize-none"
                                />
                            </div>
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                                La IA leerá la base de datos de preguntas disponibles y configurará automáticamente la cantidad, dificultad y filtros necesarios.
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left order-2 sm:order-1">
                        {mode === "ai" ? "Gemini analizará tu petición y ensamblará el examen." : "Si no hay suficientes preguntas que coincidan con tus filtros, el sistema alertará."}
                    </span>
                    <button disabled={loading} type="submit" className={`w-full sm:w-auto px-6 py-2.5 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 flex gap-2 items-center justify-center order-1 sm:order-2 ${mode === "ai" ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"}`}>
                        {loading ? "Generando..." : (mode === "ai" ? "Generar con IA ✨" : "Crear Examen")}
                    </button>
                </div>
            </form>
        </div>
    );
}
