import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, AlertCircle, FileText } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default async function ExamDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const exam = await prisma.examVersion.findUnique({
        where: { id: params.id },
        include: {
            questions: {
                include: {
                    question: true
                },
                orderBy: {
                    orderIndex: 'asc'
                }
            },
            evaluations: {
                include: {
                    group: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    if (!exam) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/exams" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{exam.title}</h1>
                            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 font-mono font-bold text-xs px-2.5 py-1 rounded-md">
                                {exam.versionCode}
                            </span>
                        </div>
                    </div>
                </div>

                <Link
                    href={`/print/exam/${exam.id}`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                >
                    <FileText size={18} />
                    Generar PDF
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Panel Izquierdo: Lista de Preguntas */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-zinc-800 dark:text-zinc-200">
                            <FileText size={20} className="text-indigo-500" />
                            <h2 className="text-lg font-bold">Reactivos en esta Plantilla ({exam.questions.length})</h2>
                        </div>

                        {exam.questions.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">Esta plantilla no tiene preguntas.</div>
                        ) : (
                            <div className="space-y-6">
                                {exam.questions.map((eq, idx) => {
                                    const q = eq.question;
                                    const contentObj = (typeof q.content === 'object' && q.content !== null) ? q.content : { text: JSON.stringify(q.content) };
                                    const contentText = (contentObj as any).text || "";
                                    const options = Array.isArray(q.options) ? q.options : [];
                                    const labels = ["A", "B", "C", "D"];

                                    return (
                                        <div key={eq.id} className="relative pl-8 pb-6 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                                            <div className="absolute left-0 top-0 w-6 h-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-xs flex items-center justify-center rounded-full">
                                                {idx + 1}
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    {q.area}
                                                </span>
                                                {(q as any).subarea && (
                                                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                        {(q as any).subarea}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-1.5 rounded">
                                                    Dif {q.difficultyLevel}
                                                </span>
                                            </div>

                                            <div className="text-zinc-900 dark:text-zinc-100 font-medium mb-3 text-sm">
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {contentText}
                                                </ReactMarkdown>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                {options.map((opt: any, optIdx: number) => (
                                                    <div
                                                        key={opt.id || optIdx}
                                                        className={`px-3 py-2 rounded-md border flex items-center ${opt.is_correct ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 font-semibold" : "bg-zinc-50 border-zinc-100 text-zinc-600 dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-400"}`}
                                                    >
                                                        <span className="font-bold mr-2">{labels[optIdx] || "•"}</span>
                                                        <div className="flex-1 overflow-x-auto">
                                                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                                {opt.text}
                                                            </ReactMarkdown>
                                                        </div>
                                                        {opt.is_correct && <span className="ml-1 text-green-600 dark:text-green-500">✔️</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Derecho: Grupos Asignados */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-zinc-800 dark:text-zinc-200">
                            <BookOpen size={20} className="text-orange-500" />
                            <h2 className="text-lg font-bold">Grupos Evaluados ({exam.evaluations.length})</h2>
                        </div>

                        {exam.evaluations.length === 0 ? (
                            <div className="text-center py-6 text-zinc-500 text-sm flex flex-col items-center gap-2">
                                <AlertCircle size={24} className="text-zinc-300 dark:text-zinc-700" />
                                <p>Esta plantilla aún no ha sido asignada a ningún grupo.</p>
                                <Link href="/dashboard/groups" className="text-indigo-600 hover:underline mt-2">
                                    Ir a Grupos para asignarla
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {exam.evaluations.map((ev) => (
                                    <div key={ev.id} className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                                Grupo: {ev.group.name}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ev.status === 'PUBLISHED'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : ev.status === 'CLOSED'
                                                    ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                }`}>
                                                {ev.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-zinc-500 grid grid-cols-2 gap-1 mt-2">
                                            <div>
                                                <span className="font-medium">Inicio:</span>
                                                <br />{ev.startDate.toLocaleDateString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Fin:</span>
                                                <br />{ev.endDate.toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
