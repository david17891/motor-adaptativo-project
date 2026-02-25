import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowLeft, Trophy, Clock, AlertCircle } from "lucide-react";

export default async function ResultPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    if (!studentId) {
        redirect("/student/login");
    }

    const result = await prisma.result.findUnique({
        where: { id: params.id },
        include: {
            evaluation: {
                include: {
                    examVersion: {
                        include: {
                            questions: {
                                include: { question: true },
                                orderBy: { orderIndex: 'asc' }
                            }
                        }
                    }
                }
            },
            answers: {
                include: { question: true }
            }
        }
    });

    if (!result || result.studentId !== studentId) {
        notFound();
    }

    // Si aún no lo completa, regresarlo al examen
    if (!result.completedAt) {
        redirect(`/student/evals/${result.evaluation.id}`);
    }

    const exam = result.evaluation.examVersion;
    const totalQuestions = exam.questions.length;
    const correctAnswers = result.answers.filter((a: any) => a.isCorrect).length;
    const isPassed = (result.score || 0) >= 60; // 60% aprobatorio

    // Duración
    const durationMs = result.completedAt.getTime() - result.startedAt.getTime();
    const durationMins = Math.floor(durationMs / 60000);
    const durationSecs = Math.floor((durationMs % 60000) / 1000);

    const isEvaluationClosed = new Date() > result.evaluation.endDate;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/student" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Reporte de Evaluación</h1>
            </div>

            {!isEvaluationClosed ? (
                <div className="bg-white dark:bg-zinc-950 border border-blue-200 dark:border-blue-900/50 rounded-xl p-8 shadow-sm flex flex-col items-center text-center space-y-4">
                    <CheckCircle2 className="text-blue-500" size={64} />
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">¡Evaluación Entregada!</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 max-w-lg mb-4">
                        Has terminado tu evaluación exitosamente. Tu calificación y el desglose de reactivos se publicarán aquí cuando venza el plazo general del examen:
                    </p>
                    <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-4 py-2 rounded-lg font-medium shadow-inner">
                        <Clock size={16} className="text-blue-500" />
                        {result.evaluation.endDate.toLocaleString()}
                    </div>
                </div>
            ) : (
                <>
                    {/* Tarjeta de Resumen */}
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className={`p-8 ${isPassed ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'} relative overflow-hidden`}>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                                <div>
                                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
                                        {isPassed ? 'Aprobado' : 'No Aprobado'}
                                    </span>
                                    <h2 className="text-3xl font-extrabold mb-2">{exam.title}</h2>
                                    <p className="text-white/80 opacity-90">{result.completedAt.toLocaleDateString()} a las {result.completedAt.toLocaleTimeString()}</p>
                                </div>

                                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                    <Trophy size={40} className={isPassed ? "text-green-200" : "text-orange-200"} />
                                    <div className="flex flex-col">
                                        <span className="text-4xl font-black">{Math.round(result.score || 0)}<span className="text-2xl opacity-75">%</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Aciertos</span>
                                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{correctAnswers} / {totalQuestions}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Errores</span>
                                <span className="text-xl font-bold text-red-600 dark:text-red-400">{totalQuestions - correctAnswers}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tiempo Invertido</span>
                                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{durationMins}m {durationSecs}s</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Código</span>
                                <span className="text-lg font-mono font-bold text-zinc-700 dark:text-zinc-300">{exam.versionCode}</span>
                            </div>
                        </div>
                    </div>

                    {/* Desglose de Respuestas */}
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Desglose de Reactivos</h3>

                        <div className="space-y-4">
                            {exam.questions.map((eq: any, idx: number) => {
                                const answerRecord = result.answers.find((a: any) => a.questionId === eq.questionId);
                                const isCorrect = answerRecord?.isCorrect;

                                return (
                                    <div key={eq.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                {isCorrect ? (
                                                    <CheckCircle2 className="text-green-600 dark:text-green-500" size={24} />
                                                ) : (
                                                    <XCircle className="text-red-600 dark:text-red-500" size={24} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Pregunta {idx + 1}</span>
                                                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                                        {eq.question.area}
                                                    </span>
                                                    {(eq.question as any).subarea && (
                                                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                            {(eq.question as any).subarea}
                                                        </span>
                                                    )}
                                                </div>

                                                {!isCorrect && (
                                                    <div className="mt-2 text-sm text-red-800 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-3 rounded-lg flex items-start gap-2">
                                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                                        <p>Seleccionaste una respuesta incorrecta o dejaste el reactivo en blanco.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            <div className="text-center pt-4">
                <Link href="/student" className="inline-block px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm">
                    Regresar a mi Tablero
                </Link>
            </div>
        </div>
    );
}
