import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdaptiveWizard from "../../adaptive/[id]/AdaptiveWizard";

export default async function PracticeRunPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: sessionId } = await params;

    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    if (!studentId) redirect("/student/login");

    const session = await prisma.dynamicSession.findUnique({
        where: { id: sessionId }
    });

    // Validar que la sesión exista, pertenezca al alumno y sea una práctica libre
    if (!session || session.studentId !== studentId || session.adaptiveEvaluationId !== null) {
        notFound();
    }

    // Castear a any temporalmente por el drift de Prisma Local
    const practiceArea = (session as any).practiceArea;
    const practiceSubarea = (session as any).practiceSubarea;

    if (session.status === "COMPLETED") {
        redirect("/student");
    }

    const title = practiceSubarea ? `Práctica: ${practiceArea} - ${practiceSubarea}` : `Práctica General: ${practiceArea}`;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
            <AdaptiveWizard
                sessionId={session.id}
                evaluationTitle={title}
                totalQuestions={(session as any).totalQuestions || 10}
                isPractice={true}
                durationMinutes={(session as any).durationMinutes}
                startedAt={session.startedAt}
            />
        </div>
    );
}
