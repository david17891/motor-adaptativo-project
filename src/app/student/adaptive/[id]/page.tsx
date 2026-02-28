import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdaptiveWizard from "./AdaptiveWizard"; // Lo crearemos en el siguiente paso

export default async function AdaptiveEvaluationRunPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: evalId } = await params;

    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    if (!studentId) redirect("/student/login");

    const adaptiveEval = await prisma.adaptiveEvaluation.findUnique({
        where: { id: evalId },
        include: {
            dynamicSessions: {
                where: { studentId }
            }
        }
    });

    if (!adaptiveEval) notFound();

    // Seguridad: verificar vigencia
    const now = new Date();
    if (now < adaptiveEval.startDate || now > adaptiveEval.endDate) {
        redirect("/student");
    }

    // Inicializar o recuperar sesión
    let session = adaptiveEval.dynamicSessions[0];

    if (!session) {
        session = await prisma.dynamicSession.create({
            data: {
                adaptiveEvaluationId: adaptiveEval.id,
                studentId,
                status: "IN_PROGRESS",
                durationMinutes: (adaptiveEval as any).durationMinutes,
                startedAt: new Date()
            } as any
        });
    }

    // Si ya terminó, redirigir al dashboard (no mostramos resultados detallados del motor aún)
    if (session.status === "COMPLETED") {
        redirect("/student");
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
            <AdaptiveWizard
                sessionId={session.id}
                evaluationTitle={adaptiveEval.title}
                totalQuestions={adaptiveEval.totalQuestions}
                durationMinutes={(session as any).durationMinutes}
                startedAt={session.startedAt}
            />
        </div>
    );
}
