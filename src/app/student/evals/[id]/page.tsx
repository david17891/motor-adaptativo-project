import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import ExamWizard from "./ExamWizard";

export default async function EvaluationRoomPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    if (!studentId) {
        redirect("/student/login");
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: studentId, role: "ALUMNO" },
        include: { groupMemberships: true }
    });

    if (!currentUser) {
        redirect("/student/login");
    }

    // Buscar la evaluación específica y validar que pertenece a un grupo del alumno
    const groupIds = currentUser.groupMemberships.map((g) => g.groupId);

    const evaluation = await prisma.evaluation.findFirst({
        where: {
            id: params.id,
            groupId: { in: groupIds }
        },
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
    });

    if (!evaluation) {
        notFound();
    }

    // Verificar fechas
    const now = new Date();
    if (now < evaluation.startDate) {
        return <div className="p-8 text-center text-orange-500 font-bold max-w-xl mx-auto border-2 border-orange-200 bg-orange-50 rounded-xl mt-12">
            Esta evaluación aún no comienza. La fecha de inicio programada es {evaluation.startDate.toLocaleString()}.
        </div>;
    }
    if (now > evaluation.endDate) {
        return <div className="p-8 text-center text-red-500 font-bold max-w-xl mx-auto border-2 border-red-200 bg-red-50 rounded-xl mt-12">
            Esta evaluación ya expiró el {evaluation.endDate.toLocaleString()}. No es posible resolverla.
        </div>;
    }

    // Buscar si ya existe un Result (Intento de examen)
    let result = await prisma.result.findUnique({
        where: {
            evaluationId_studentId: {
                evaluationId: evaluation.id,
                studentId: currentUser.id
            }
        },
        include: {
            answers: true
        }
    });

    if (result && result.completedAt) {
        // Redirigir a resultados si ya lo terminó
        redirect(`/student/results/${result.id}`);
    }

    // Si no ha empezado, le creamos el Result (Empieza a correr el reloj interno)
    if (!result) {
        result = await prisma.result.create({
            data: {
                evaluationId: evaluation.id,
                studentId: currentUser.id,
                startedAt: new Date()
            },
            include: {
                answers: true
            }
        });
    }

    // Mapear la estructura de Data para el Front End
    const questionsForWizard = evaluation.examVersion.questions.map((eq) => {
        const q = eq.question;
        const contentObj = (typeof q.content === 'object' && q.content !== null) ? q.content : { text: JSON.stringify(q.content) };

        return {
            id: q.id,
            area: q.area,
            subarea: q.subarea,
            content: { text: (contentObj as any).text },
            options: q.options as any[]
        };
    });

    const initialAnswers: Record<string, string> = {};
    if (result && result.answers) {
        result.answers.forEach((ans) => {
            if (ans.selectedOptionId) {
                initialAnswers[ans.questionId] = ans.selectedOptionId;
            }
        });
    }

    return (
        <ExamWizard
            resultId={result?.id as string}
            title={evaluation.examVersion.title}
            questions={questionsForWizard}
            initialAnswers={initialAnswers}
            durationMinutes={(evaluation as any).durationMinutes}
            startedAt={result?.startedAt}
        />
    );
}
