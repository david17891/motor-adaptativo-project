"use client";

import { useState, useTransition } from "react";
import { addEvaluationToGroup } from "./actions";
import { Clock, Calculator } from "lucide-react";

export default function AssignEvaluationForm({
    groupId,
    availableExams,
    today,
    nextWeekFormatted
}: {
    groupId: string;
    availableExams: any[];
    today: string;
    nextWeekFormatted: string;
}) {
    const [isPending, startTransition] = useTransition();
    const [selectedExamId, setSelectedExamId] = useState("");
    const [duration, setDuration] = useState<number | "">("");
    const [error, setError] = useState<string | null>(null);

    const selectedExam = availableExams.find(ex => ex.id === selectedExamId);
    const questionCount = selectedExam?._count?.questions || 0;

    const calculateTime = (minsPerQuestion: number) => {
        if (!questionCount) return;
        setDuration(Math.ceil(questionCount * minsPerQuestion));
    };

    async function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const res = await addEvaluationToGroup(formData);
            if (res?.error) {
                setError(res.error);
            } else {
                // Success - Reset form or let it be handle by refresh
                setDuration("");
                setSelectedExamId("");
            }
        });
    }

    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Asignar Examen</h3>

            {error && (
                <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-lg">
                    {error}
                </div>
            )}

            <form action={handleSubmit} className="space-y-4">
                <input type="hidden" name="groupId" value={groupId} />

                <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">Versión de Examen (Plantilla)</label>
                    <select
                        name="examVersionId"
                        required
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 transition-all focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">-- Selecciona Examen --</option>
                        {availableExams.map((ex: any) => (
                            <option key={ex.id} value={ex.id}>{ex.title} ({ex.versionCode}) - {ex._count.questions} reactivos</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">Vigencia (Disponibilidad)</label>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs">
                        <div className="flex-1">
                            <span className="text-[10px] text-zinc-400 block mb-1">Desde:</span>
                            <input type="date" name="startDate" defaultValue={today} required className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] text-zinc-400 block mb-1">Hasta:</span>
                            <input type="date" name="endDate" defaultValue={nextWeekFormatted} required className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">Duración (Minutos)</label>
                        {questionCount > 0 && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                                <Calculator size={10} /> {questionCount} reactivos detectados
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <input
                            type="number"
                            name="durationMinutes"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value === "" ? "" : parseInt(e.target.value))}
                            placeholder="Minutos totales"
                            min={1}
                            className="w-full px-4 py-2 text-sm border-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-blue-500 transition-all outline-none font-bold"
                        />

                        {questionCount > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => calculateTime(1)}
                                    className="text-[10px] font-bold px-2 py-1 border rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    1 min/preg ({questionCount}m)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => calculateTime(2)}
                                    className="text-[10px] font-bold px-2 py-1 border rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-blue-200 text-blue-600"
                                >
                                    2 min/preg ({questionCount * 2}m)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => calculateTime(3)}
                                    className="text-[10px] font-bold px-2 py-1 border rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    3 min/preg ({questionCount * 3}m)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => calculateTime(1.6)}
                                    className="text-[10px] font-black px-2 py-1 border-2 border-orange-200 text-orange-600 rounded bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors flex items-center gap-1"
                                >
                                    ⭐ UABC ({Math.ceil(questionCount * 1.6)}m)
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isPending || !selectedExamId}
                        className="w-full px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-white transition-all disabled:opacity-50 shadow-md active:scale-95"
                    >
                        {isPending ? "Asignando..." : "Finalizar Asignación"}
                    </button>
                </div>
            </form>
        </div>
    );
}
