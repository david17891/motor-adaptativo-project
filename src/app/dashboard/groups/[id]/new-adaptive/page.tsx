// App placeholder para el formulario de crear adaptativa
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import DynamicEvaluationForm from "./DynamicEvaluationForm";

export default async function NewAdaptiveEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: groupId } = await params;

    const group = await prisma.group.findUnique({
        where: { id: groupId }
    });

    if (!group) redirect("/dashboard/groups");

    const curriculumAreas = await prisma.subjectArea.findMany({
        where: { isActive: true },
        include: { topics: true },
        orderBy: { name: 'asc' }
    });

    const uniqueAreas = curriculumAreas.map(a => a.name);

    // Mantenemos la lógica de descubrir subtemas "específicos" (como "Semana 1") 
    // extrayéndolos de las preguntas existentes + el nuevo catálogo
    const allQuestions = await prisma.question.findMany({
        select: {
            area: true,
            subarea: true,
            content: true
        }
    });

    const topicsSet = new Set<string>();

    // Añadir temas del catálogo base
    curriculumAreas.forEach(a => {
        a.topics.forEach(t => topicsSet.add(t.name.trim().replace(/\s+/g, ' ')));
    });

    // Añadir temas de las preguntas existentes
    allQuestions.forEach(q => {
        if (q.subarea && q.subarea.trim()) {
            topicsSet.add(q.subarea.trim().replace(/\s+/g, ' '));
        }
    });

    const availableTopics = Array.from(topicsSet).sort((a, b) => a.localeCompare(b));

    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekFormatted = nextWeek.toISOString().split("T")[0];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/groups/${group.id}`} className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <ArrowLeft size={18} className="text-zinc-600 dark:text-zinc-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Programar Evaluación Dinámica</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Grupo: {group.name}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <DynamicEvaluationForm
                    groupId={group.id}
                    uniqueAreas={uniqueAreas}
                    availableTopics={availableTopics}
                    today={today}
                    nextWeekFormatted={nextWeekFormatted}
                />
            </div>
        </div>
    );
}
