import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { PrintButton } from "./PrintButton";

export default async function PrintExamPage(props: { params: Promise<{ id: string }> }) {
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
            }
        }
    });

    if (!exam) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-white text-black p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
            {/* Botón flotante para imprimir (no visible en impresión) */}
            <div className="fixed top-4 right-4 print:hidden">
                <PrintButton />
            </div>

            {/* Cabecera del Examen */}
            <div className="mb-8 border-b-2 border-black pb-4">
                <h1 className="text-3xl font-bold mb-2 uppercase text-center">{exam.title}</h1>
                <div className="text-center font-mono text-sm mb-6 text-gray-600">
                    Versión: {exam.versionCode}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <span>Nombre del Alumno(a):</span>
                        <div className="border-b border-black flex-1 h-5"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Fecha:</span>
                        <div className="border-b border-black w-32 h-5"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Grupo:</span>
                        <div className="border-b border-black flex-1 h-5"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Calificación:</span>
                        <div className="border-b border-black w-32 h-5"></div>
                    </div>
                </div>
            </div>

            {/* Preguntas */}
            <div className="space-y-8">
                {exam.questions.map((eq, idx) => {
                    const q = eq.question;
                    const contentObj = (typeof q.content === 'object' && q.content !== null) ? q.content : { text: JSON.stringify(q.content) };
                    const contentText = (contentObj as any).text || "";
                    const options = Array.isArray(q.options) ? q.options : [];
                    const labels = ["A", "B", "C", "D"];

                    return (
                        <div key={eq.id} className="break-inside-avoid">
                            <div className="flex gap-4">
                                <div className="font-bold text-lg min-w-[2rem]">{idx + 1}.</div>
                                <div className="flex-1">
                                    <div className="mb-4 prose max-w-none prose-sm">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {contentText}
                                        </ReactMarkdown>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {options.map((opt: any, optIdx: number) => (
                                            <div key={opt.id || optIdx} className="flex gap-2">
                                                <span className="font-semibold uppercase w-6">{labels[optIdx]})</span>
                                                <div className="flex-1 prose max-w-none prose-sm">
                                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                        {opt.text}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Salto de página para la Hoja de Respuestas */}
            <div className="break-before-page pt-8">
                <div className="border-b-2 border-black pb-4 mb-6">
                    <h2 className="text-2xl font-bold uppercase text-center mb-2">Hoja de Respuestas</h2>
                    <h3 className="text-xl text-center">{exam.title}</h3>
                    <div className="text-center font-mono text-sm mt-2">Versión: {exam.versionCode}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
                    {exam.questions.map((eq, idx) => {
                        const q = eq.question;
                        const options = Array.isArray(q.options) ? q.options : [];
                        const labels = ["A", "B", "C", "D"];

                        // Encontrar la(s) opción(es) correcta(s)
                        const correctIndices = options
                            .map((opt: any, i) => opt.is_correct ? i : -1)
                            .filter(i => i !== -1);

                        const correctLabels = correctIndices.map(i => labels[i]).join(', ') || "N/A";

                        return (
                            <div key={eq.id} className="flex justify-between border-b border-gray-300 pb-1">
                                <span className="font-bold">{idx + 1}.</span>
                                <span className="font-bold text-indigo-700">{correctLabels}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
