"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ensureMath } from "@/lib/math";
import { Clock, ChevronRight, Activity, Lightbulb } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function AdaptiveWizard({
    sessionId,
    evaluationTitle,
    totalQuestions,
    isPractice = false,
    durationMinutes,
    startedAt
}: {
    sessionId: string,
    evaluationTitle: string,
    totalQuestions: number,
    isPractice?: boolean,
    durationMinutes?: number | null,
    startedAt?: Date
}) {
    const router = useRouter();


    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [questionStartTime, setQuestionStartTime] = useState<number>(0);
    const [examFinished, setExamFinished] = useState(false);
    const [finishReason, setFinishReason] = useState("");
    const [finalScore, setFinalScore] = useState<number | null>(null);

    // Las preguntas en adaptativo no sabemos cuántas van hechas hasta que el server contesta, 
    // pero podemos llevar un contador local aproximado (vienen del server).
    // Para simplificar MVP V1, el API nos dice isFinished.
    const [questionsAnsweredLocal, setQuestionsAnsweredLocal] = useState(0);
    const [timeLeftPercent, setTimeLeftPercent] = useState(100);
    const [timeLeftString, setTimeLeftString] = useState<string | null>(null);

    const fetchNextQuestion = async () => {
        setIsLoading(true);
        // Hacemos el request de la siguiente pregunta. Como el API necesita "submitAdaptiveAnswer"
        // para dar la siguiente, tenemos un endpoint especial o usamos el mismo pasándole data null 
        // para inicializar.

        try {
            // El API Answer también nos da la primera pregunta si mandamos selectedOptionId nulo.
            const res = await fetch('/api/adaptive/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    questionId: currentQuestion?.id || "FIRST_LOAD", // Flag para que el backend sepa que es request inicial
                    selectedOptionId: null,
                    timeSpentMs: 0
                })
            });
            const data = await res.json();

            if (data.isFinished) {
                setExamFinished(true);
                setFinishReason(data.reason);
                setFinalScore(data.finalScore);
            } else {
                setCurrentQuestion(data.nextQuestion);
                setSelectedOption(null);
                setShowHint(false);
                setQuestionStartTime(Date.now());
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error fetching question:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNextQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnswerSubmit = async () => {
        if (!selectedOption || !currentQuestion) return;
        setIsSubmitting(true);
        const timeSpent = Date.now() - questionStartTime;

        try {
            const res = await fetch('/api/adaptive/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    questionId: currentQuestion.id,
                    selectedOptionId: selectedOption,
                    timeSpentMs: timeSpent,
                    usedHint: showHint
                })
            });

            const data = await res.json();
            setQuestionsAnsweredLocal(prev => prev + 1);

            if (data.isFinished) {
                setExamFinished(true);
                setFinishReason(data.reason);
                setFinalScore(data.finalScore);
            } else {
                setCurrentQuestion(data.nextQuestion);
                setSelectedOption(null);
                setShowHint(false);
                setQuestionStartTime(Date.now());
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
            alert("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
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

                // Finalizar por tiempo agotado
                handleTimeExpired();
                return;
            }

            let minutes = Math.floor(diff / 60000);
            let seconds = Math.floor((diff % 60000) / 1000);

            // Fix bounds issues with display
            if (minutes < 0) minutes = 0;
            if (seconds < 0) seconds = 0;

            const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            setTimeLeftString(display);
            setTimeLeftPercent(Math.max(0, (diff / durationMs) * 100));
        }, 1000);

        return () => clearInterval(timer);
    }, [durationMinutes, startedAt]);

    const handleTimeExpired = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/adaptive/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    questionId: currentQuestion?.id || "TIME_EXPIRED",
                    selectedOptionId: null,
                    timeSpentMs: 0,
                    forceFinish: true // Avisar que se acabó el tiempo
                })
            });
            const data = await res.json();

            if (data.error) {
                console.error("Server returned error on time expire:", data.error);
                setExamFinished(true);
                setFinishReason("Error finalizando el tiempo.");
                setFinalScore(0);
                return;
            }

            setExamFinished(true);
            setFinishReason("Tiempo Agotado");
            setFinalScore(data.finalScore || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (examFinished) {
        return (
            <div className="bg-white dark:bg-zinc-950 border-2 border-purple-200 dark:border-purple-900/50 rounded-2xl p-8 shadow-xl text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Activity size={40} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-2">Evaluación Finalizada</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">{finishReason}</p>
                </div>

                <div className="py-6 border-y border-zinc-100 dark:border-zinc-800">
                    <span className="block text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Puntaje Estimado del Motor</span>
                    <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100">{finalScore}%</span>
                </div>

                <div className="pt-4">
                    <button onClick={() => router.push('/student')} className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                        Volver al Portal
                    </button>
                    <p className="mt-4 text-xs text-zinc-400">Tus resultados han sido enviados al profesor.</p>
                </div>
            </div>
        );
    }

    if (isLoading || !currentQuestion) {
        return (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 animate-pulse" />
                <Activity size={48} className="mx-auto text-purple-500 mb-6 animate-bounce" />
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">El Motor está analizando tu perfil...</h3>
                <p className="text-zinc-500 mt-2">Generando la siguiente pregunta adaptativa ideal para ti.</p>
            </div>
        );
    }

    const questionOptions = currentQuestion.options as any[];

    // Extraer nombre de la materia/área del título para la UI (ej. "Práctica: Español - Lectura" -> "Español")
    const resolvedArea = evaluationTitle.includes(':')
        ? evaluationTitle.split(':')[1].split('-')[0].trim()
        : (currentQuestion.area || "Evaluación");

    return (
        <div className="space-y-6">
            {/* Cabecera Adaptativa */}
            <div className="bg-white dark:bg-zinc-950 border-b-4 border-purple-500 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-10 transition-all">
                <div className="flex-1">
                    <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {evaluationTitle}
                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest hidden sm:inline-block">Adaptativo</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm font-medium text-zinc-500">
                        <span className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">
                            <Activity size={16} /> Motor V1
                        </span>
                        <span className="flex items-center gap-1"> {resolvedArea} Activo</span>
                    </div>
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

                <div className="text-right bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full sm:w-auto shadow-inner">
                    <span className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Avance del Motor</span>
                    <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                        {Math.min(questionsAnsweredLocal + 1, totalQuestions)} <span className="text-sm font-medium text-zinc-400">/ {totalQuestions}</span>
                    </span>
                </div>
            </div>

            {/* Contenedor de la Pregunta */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-lg transition-all duration-300">
                <div className="p-6 sm:p-8 bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-start mb-6">
                        <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-sm">
                            Reactivo #{questionsAnsweredLocal + 1}
                        </span>
                    </div>

                    <div className="prose prose-zinc dark:prose-invert max-w-none prose-lg">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {ensureMath(currentQuestion.content?.text || currentQuestion.content?.html || "Sin contenido visualizable.")}
                        </ReactMarkdown>
                    </div>

                    {/* Hint Section (Only for Practice) */}
                    {isPractice && currentQuestion.hint && (
                        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            {!showHint ? (
                                <button
                                    onClick={() => setShowHint(true)}
                                    className="flex items-center gap-2 text-sm font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                                >
                                    <Lightbulb size={18} />
                                    Usar Pista Opcional (-5 XP)
                                </button>
                            ) : (
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-2">
                                        <Lightbulb size={18} /> Pista Revelada (XP Reducida)
                                    </h4>
                                    <p className="text-zinc-700 dark:text-zinc-300 text-sm">
                                        {currentQuestion.hint}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Opciones */}
                <div className="p-6 sm:p-8 bg-white dark:bg-zinc-950">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Selecciona tu respuesta:</h3>
                    <div className="space-y-3">
                        {questionOptions.map((opt, optIndex) => (
                            <label
                                key={opt.id}
                                className={`
                                    flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-200
                                    ${selectedOption === opt.id
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 ring-2 ring-purple-500/20 shadow-sm'
                                        : 'border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'}
                                `}
                            >
                                <div className="flex items-center h-5">
                                    <input
                                        type="radio"
                                        name="adaptive_question_option"
                                        value={opt.id}
                                        checked={selectedOption === opt.id}
                                        onChange={() => setSelectedOption(opt.id)}
                                        className="w-4 h-4 text-purple-600 ring-offset-zinc-50 focus:ring-purple-500 dark:ring-offset-zinc-950 dark:bg-zinc-900 dark:border-zinc-800"
                                    />
                                </div>
                                <div className="ml-3 flex-1 flex">
                                    <span className="font-bold text-zinc-400 mr-2 w-4 shrink-0">{String.fromCharCode(65 + optIndex)}.</span>
                                    <div className="text-zinc-700 dark:text-zinc-300">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {ensureMath(opt.text)}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Controles */}
            <div className="flex justify-end pt-4 pb-8">
                <button
                    onClick={handleAnswerSubmit}
                    disabled={!selectedOption || isSubmitting}
                    className="flex items-center gap-2 px-8 py-4 bg-purple-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 hover:bg-purple-700 transition-colors text-white font-bold rounded-xl shadow-lg disabled:shadow-none"
                >
                    {isSubmitting ? (
                        <>Procesando respuesta... <Activity size={20} className="animate-pulse" /></>
                    ) : (
                        <>Confirmar y Siguiente <ChevronRight size={20} /></>
                    )}
                </button>
            </div>

        </div>
    );
}
