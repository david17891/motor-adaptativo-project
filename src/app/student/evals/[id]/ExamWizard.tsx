"use client";

import { useState, useTransition } from "react";
import { ChevronRight, ChevronLeft, Send, AlertTriangle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { submitEvaluation, saveAnswer } from "./actions";
import { useRouter } from "next/navigation";
import { ensureMath } from "@/lib/math";
import { useEffect } from "react";

type Option = {
    id: string;
    text: string;
    is_correct: boolean;
};

type QuestionData = {
    id: string;
    area: string;
    subarea?: string | null;
    content: {
        text?: string;
    };
    options: Option[];
};

export default function ExamWizard({
    resultId,
    title,
    questions,
    initialAnswers = {},
    durationMinutes,
    startedAt
}: {
    resultId: string;
    title: string;
    questions: QuestionData[];
    initialAnswers?: Record<string, string>;
    durationMinutes?: number | null;
    startedAt?: Date;
}) {


    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [timeLeftPercent, setTimeLeftPercent] = useState(100);
    const [timeLeftString, setTimeLeftString] = useState<string | null>(null);

    const isLast = currentIndex === questions.length - 1;
    const isFirst = currentIndex === 0;

    const currentQuestion = questions[currentIndex];
    const total = questions.length;
    const answeredCount = Object.keys(answers).length;
    const progressPercent = Math.round((answeredCount / total) * 100);

    const handleSelectOption = (questionId: string, optionId: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));

        // Autoguardado silencioso
        startTransition(() => {
            saveAnswer(resultId, questionId, optionId).catch(console.error);
        });
    };

    const handleNext = () => {
        if (!isLast) setCurrentIndex(c => c + 1);
    };

    const handlePrev = () => {
        if (!isFirst) setCurrentIndex(c => c - 1);
    };

    // --- LÓGICA DEL TEMPORIZADOR ---
    useEffect(() => {
        if (!durationMinutes || !startedAt) return;

        const durationMs = durationMinutes * 60 * 1000;
        const endTime = new Date(startedAt).getTime() + durationMs;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const diff = endTime - now;

            if (diff <= 0) {
                clearInterval(timer);
                setTimeLeftString("00:00");
                setTimeLeftPercent(0);
                // Auto-submit si el tiempo se acaba
                handleSubmit(true);
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            setTimeLeftString(display);
            setTimeLeftPercent((diff / durationMs) * 100);
        }, 1000);

        return () => clearInterval(timer);
    }, [durationMinutes, startedAt]);

    const handleSubmit = (auto: boolean = false) => {
        if (!auto && answeredCount < total) {
            const confirmMissing = confirm(`Faltan ${total - answeredCount} preguntas por responder. ¿Estás seguro de enviar tu evaluación?`);
            if (!confirmMissing) return;
        }

        startTransition(async () => {
            setError(null);
            const res = await submitEvaluation(resultId, answers);
            if (res.error) {
                setError(res.error);
            } else if (res.url) {
                // Navegar inmediatamente a la pantalla de resultados generados
                router.push(res.url);
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header del Examen */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
                    <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-orange-500" />
                        Estás tomando una evaluación oficial. No cierres esta ventana.
                    </p>
                </div>

                {timeLeftString && (
                    <div className="flex flex-col items-center sm:items-end gap-1.5 min-w-[140px]">
                        <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-200 dark:border-orange-800/50 rounded-2xl shadow-sm">
                            <span className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter">Tiempo</span>
                            <span className="text-2xl font-black font-mono text-orange-700 dark:text-orange-300 leading-none">{timeLeftString}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                            <div
                                className={`h-full transition-all duration-1000 ${timeLeftPercent < 20 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}
                                style={{ width: `${timeLeftPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="hidden md:flex flex-col items-end gap-2 pr-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                        Progreso del examen
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">
                            {answeredCount} / {total}
                        </span>
                        <div className="w-32 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                            <div
                                className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <span className="font-medium text-sm">{error}</span>
                </div>
            )}

            {/* Layout Principal: Navegador + Pregunta */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Cuadrícula de Navegación Rápida */}
                <div className="md:col-span-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm h-fit sticky top-24 hidden md:block">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Reactivos</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => {
                            const isAnswered = !!answers[q.id];
                            const isCurrent = currentIndex === idx;
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`aspect-square rounded-md text-xs font-bold flex items-center justify-center transition-all ${isCurrent
                                        ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-950 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                        : isAnswered
                                            ? "bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900"
                                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Área de Pregunta */}
                <div className="md:col-span-3">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm min-h-[400px] flex flex-col">

                        {/* Cabecera de la Pregunta */}
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center group">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Pregunta {currentIndex + 1}</h2>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    {currentQuestion.area}
                                </span>
                                {currentQuestion.subarea && (
                                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {currentQuestion.subarea}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Contenido */}
                        <div className="p-6 flex-grow">
                            <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-[15px] mb-8 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {ensureMath(currentQuestion.content.text || "")}
                                </ReactMarkdown>
                            </div>

                            <div className="space-y-3">
                                {currentQuestion.options.map((opt, optIdx) => {
                                    const labels = ["A", "B", "C", "D"];
                                    const isSelected = answers[currentQuestion.id] === opt.id;

                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                                            className={`w-full flex items-center p-4 border rounded-xl text-left transition-all ${isSelected
                                                ? "bg-indigo-50 border-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-500 shadow-sm"
                                                : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50"
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mr-4 ${isSelected
                                                ? "bg-indigo-600 text-white"
                                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                                                }`}>
                                                {labels[optIdx] || "•"}
                                            </div>
                                            <div className={`flex-1 overflow-x-auto ${isSelected ? "text-indigo-900 dark:text-indigo-200 font-medium" : "text-zinc-700 dark:text-zinc-300"}`}>
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {ensureMath(opt.text)}
                                                </ReactMarkdown>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Controles de Navegación del Módulo */}
                        <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 rounded-b-xl flex gap-3 justify-between items-center sm:flex-row flex-col-reverse">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handlePrev}
                                    disabled={isFirst}
                                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full sm:w-auto justify-center"
                                >
                                    <ChevronLeft size={16} /> Anterior
                                </button>

                                {!isLast && (
                                    <button
                                        onClick={handleNext}
                                        className="px-4 py-2 bg-zinc-900 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-300 transition-colors shadow-sm w-full sm:w-auto justify-center"
                                    >
                                        Siguiente <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>

                            {isLast && (
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={isPending}
                                    className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-md w-full sm:w-auto justify-center ${answeredCount < total
                                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                                >
                                    {isPending ? "Enviando..." : (
                                        <>Finalizar Evaluación <Send size={16} /></>
                                    )}
                                </button>
                            )}
                        </div>

                    </div>

                    {/* Botón Flotante Opcional para Móviles de Navegación Rápida */}
                    <div className="mt-6 md:hidden">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3 text-center">Reactivos</span>
                        <div className="flex flex-wrap justify-center gap-2">
                            {questions.map((q, idx) => (
                                <button
                                    key={`mob-${q.id}`}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center ${currentIndex === idx
                                        ? "ring-2 ring-indigo-500 bg-indigo-100 text-indigo-700"
                                        : !!answers[q.id]
                                            ? "bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900"
                                            : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
