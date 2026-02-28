"use client";

import { useState } from "react";
import { generateFreePractice } from "./actions";
import { useRouter } from "next/navigation";

export default function PracticeForm({
    areasObj
}: {
    areasObj: Record<string, string[]>
}) {
    const [loading, setLoading] = useState(false);
    const [selectedArea, setSelectedArea] = useState("");
    const router = useRouter();

    const availableAreas = Object.keys(areasObj).sort();
    const availableTopics = selectedArea && areasObj[selectedArea] ? areasObj[selectedArea].sort((a, b) => a.localeCompare(b)) : [];

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = await generateFreePractice(formData);
            if (result?.error) {
                alert(result.error);
                setLoading(false);
            } else if (result?.url) {
                router.push(result.url);
            }
        } catch (error: any) {
            alert(error.message || "Error al generar la práctica.");
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="bg-white dark:bg-zinc-950 border-2 border-indigo-200 dark:border-indigo-900/40 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">🧠 Generar Práctica Adaptativa</h3>
            <p className="text-sm text-zinc-500 mb-6">Elige una materia y opcionalmente un tema. El motor ajustará la dificultad según tus aciertos y errores en tiempo real.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Materia (Área)</label>
                    <select
                        name="targetArea"
                        required
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">-- Selecciona una Materia --</option>
                        {availableAreas.map(area => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                        <optgroup label="Modos Especiales ⭐">
                            <option value="Repaso Espaciado">Repaso Espaciado (Reforzamiento)</option>
                        </optgroup>
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        Temas o Semanas
                    </label>

                    {selectedArea ? (
                        availableTopics.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                                {availableTopics.map((topic, i) => (
                                    <label key={i} className="flex items-center gap-3 p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm">
                                        <input
                                            type="checkbox"
                                            name="targetSubarea"
                                            value={topic}
                                            className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate font-medium" title={topic}>{topic}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-lg text-sm text-zinc-500 text-center bg-zinc-50 dark:bg-zinc-900">
                                Práctica general para {selectedArea}.
                            </div>
                        )
                    ) : (
                        <div className="p-3 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-lg text-sm text-zinc-500 text-center bg-zinc-50 dark:bg-zinc-900">
                            Selecciona una materia primero.
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                            Volumen de Práctica
                        </label>
                        <select
                            name="totalQuestions"
                            className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 font-bold"
                            defaultValue={10}
                        >
                            <option value={5}>5 preguntas (Rápido)</option>
                            <option value={10}>10 preguntas (Estándar)</option>
                            <option value={15}>15 preguntas (Desafío Medio)</option>
                            <option value={20}>20 preguntas (Reto)</option>
                            <option value={30}>30 preguntas (Maratón)</option>
                        </select>
                        <p className="text-xs text-zinc-500">¿Cuántos problemas quieres resolver en esta sesión?</p>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                ⏱️ Temporizador (Presión)
                            </label>
                            <p className="text-xs text-zinc-500">Minutos máximos por problema.</p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1.5">
                            {[
                                { value: null, label: "Sin límite" },
                                { value: 1, label: "⚡ 1m/preg" },
                                { value: 1.6, label: "⭐ UABC (1.6m)" },
                                { value: 2, label: "🐢 2m/preg" },
                                { value: 3, label: "3m/preg" }
                            ].map((opt) => (
                                <label key={opt.label} className="relative group flex items-center justify-center">
                                    <input
                                        type="radio"
                                        name="minsPerQuestion"
                                        value={opt.value || ""}
                                        defaultChecked={opt.value === null}
                                        className="peer sr-only"
                                    />
                                    <div className="px-3 py-2 text-[10px] items-center text-center font-black border-2 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 dark:peer-checked:border-indigo-500 dark:peer-checked:bg-indigo-900/30 dark:peer-checked:text-indigo-400 cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-700 uppercase tracking-tighter">
                                        {opt.label}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !selectedArea}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors font-bold shadow-sm"
                >
                    {loading ? "Generando..." : "Iniciar Práctica Libre"}
                </button>
            </div>
        </form>
    );
}
