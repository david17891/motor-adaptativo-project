import prisma from "@/lib/prisma";
import ExamForm from "./ExamForm";
import Link from "next/link";
import DeleteExamButton from "./DeleteExamButton";

export default async function ExamsPage() {
    const exams = await prisma.examVersion.findMany({
        include: {
            _count: {
                select: { questions: true }
            }
        },
        orderBy: { createdAt: "desc" },
    });

    // Extraer preguntas para agrupar áreas y subtemas dinámicamente
    const allQuestions = await prisma.question.findMany({
        select: {
            area: true,
            subarea: true,
            content: true
        }
    });

    const areasMap = new Map<string, number>();
    const topicsSet = new Set<string>();

    allQuestions.forEach((q: any) => {
        // Build areas count
        if (q.area) {
            areasMap.set(q.area, (areasMap.get(q.area) || 0) + 1);
        }

        // Build unique topics/subareas
        const normalize = (text: string) => text.trim().replace(/\s+/g, ' ');

        if (q.subarea) {
            topicsSet.add(normalize(q.subarea));
        }

        const qContent = q.content as any;
        if (qContent && Array.isArray(qContent.topics)) {
            qContent.topics.forEach((t: string) => {
                if (typeof t === 'string' && t.trim()) {
                    topicsSet.add(normalize(t));
                }
            });
        }
    });

    const availableAreas = Array.from(areasMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const availableTopics = Array.from(topicsSet).sort((a, b) => a.localeCompare(b));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Versiones de Exámenes</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Dile al sistema los parámetros (dificultad, temas, cantidad) y generará un examen aleatorio extrayendo de tu banco.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Generador Automático de Examen</h2>
                <ExamForm availableAreas={availableAreas} availableTopics={availableTopics} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-6">
                {exams.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500">
                        Aún no has creado ninguna versión de examen.
                    </div>
                ) : (
                    exams.map((exam: any) => (
                        <div key={exam.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-colors flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 font-mono font-bold text-xs px-2.5 py-1 rounded-md">
                                    {exam.versionCode}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${exam.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}>
                                        {exam.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                    <DeleteExamButton id={exam.id} />
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2 leading-tight">{exam.title}</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex-grow">
                                {exam._count.questions} Preguntas asignadas.
                            </p>

                            <div className="mt-auto grid grid-cols-1 gap-2">
                                <Link
                                    href={`/dashboard/exams/${exam.id}`}
                                    className="px-3 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-sm font-medium transition-colors text-center border border-indigo-100 dark:border-indigo-900/30"
                                >
                                    Abrir Detalles y Reactivos
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
