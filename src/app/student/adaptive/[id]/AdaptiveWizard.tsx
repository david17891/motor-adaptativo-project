"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronRight, Activity } from "lucide-react";

export default function AdaptiveWizard({ sessionId, evaluationTitle, totalQuestions }: { sessionId: string, evaluationTitle: string, totalQuestions: number }) {
    const router = useRouter();

    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [questionStartTime, setQuestionStartTime] = useState<number>(0);
    const [examFinished, setExamFinished] = useState(false);
    const [finishReason, setFinishReason] = useState("");
    const [finalScore, setFinalScore] = useState<number | null>(null);

    // Las preguntas en adaptativo no sabemos cuántas van hechas hasta que el server contesta, 
    // pero podemos llevar un contador local aproximado (vienen del server).
    // Para simplificar MVP V1, el API nos dice isFinished.
    const [questionsAnsweredLocal, setQuestionsAnsweredLocal] = useState(0);

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
                    timeSpentMs: timeSpent
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
                setQuestionStartTime(Date.now());
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
            alert("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
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

    return (
        <div className="space-y-6">
            {/* Cabecera Adaptativa */}
            <div className="bg-white dark:bg-zinc-950 border-b-4 border-purple-500 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-10">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {evaluationTitle}
                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest hidden sm:inline-block">Adaptativo</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm font-medium text-zinc-500">
                        <span className="flex items-center gap-1"><Clock size={16} /> En progreso</span>
                        <span className="flex items-center gap-1"><Activity size={16} className="text-purple-500" /> Motor V1 Activo</span>
                    </div>
                </div>
                <div className="text-right bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full sm:w-auto">
                    <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Avance Est.</span>
                    <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{questionsAnsweredLocal + 1} <span className="text-sm font-medium text-zinc-400">/ {totalQuestions}</span></span>
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
                        <div dangerouslySetInnerHTML={{ __html: currentQuestion.content?.html || currentQuestion.content?.text || "Sin contenido visualizable." }} />
                    </div>
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
                                    <span className="font-bold text-zinc-400 mr-2 w-4">{String.fromCharCode(65 + optIndex)}.</span>
                                    <span className="text-zinc-700 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: opt.text }} />
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
