"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function generateFreePractice(formData: FormData) {
    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    if (!studentId) {
        return { error: "No hay sesión activa de estudiante." };
    }

    const practiceArea = formData.get("targetArea") as string;
    const practiceSubarea = formData.get("targetSubarea") as string;

    const totalQuestionsStr = formData.get("totalQuestions") as string;
    const totalQuestions = totalQuestionsStr ? parseInt(totalQuestionsStr) : 10;

    const minsPerQuestionStr = formData.get("minsPerQuestion") as string;
    const minsPerQuestion = minsPerQuestionStr ? parseFloat(minsPerQuestionStr) : null;
    const durationMinutes = minsPerQuestion ? Math.ceil(totalQuestions * minsPerQuestion) : null;

    if (!practiceArea) {
        return { error: "Debes seleccionar una materia para practicar." };
    }

    // Validación especial para Repaso Espaciado: verificar si hay errores previos
    if (practiceArea === "Repaso Espaciado") {
        const failedAnswersCount = await prisma.dynamicSessionAnswer.count({
            where: {
                dynamicSession: { studentId },
                isCorrect: false
            }
        });

        if (failedAnswersCount === 0) {
            return { error: "Aún no tienes preguntas incorrectas en tu historial. ¡Sigue practicando otras áreas primero!" };
        }
    }

    // Como es práctica libre, no asignamos adaptiveEvaluationId (null).
    // Anotamos en los nuevos campos practiceArea y practiceSubarea qué eligió.
    try {
        const session = await prisma.dynamicSession.create({
            data: {
                studentId,
                practiceArea,
                practiceSubarea: practiceSubarea || null,
                currentLevel: 2, // Empieza en dificultad media
                durationMinutes,
                totalQuestions,
                status: "IN_PROGRESS"
            } as any
        });

        // Retornar URL en lugar de redireccionar aquí para manejarlo en cliente
        return { url: `/student/practice/${session.id}` };
    } catch (error: any) {
        console.error("Error creating practice session:", error);
        return { error: "Error de Prisma: Es probable que necesites REINICIAR LA TERMINAL de 'npm run dev' para que detecte los cambios en la base de datos (totalQuestions)." };
    }
}

export async function deletePracticeSession(sessionId: string) {
    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    if (!studentId) {
        throw new Error("No autenticado.");
    }

    // Asegurarnos que la sesión pertenece a este alumno y es de práctica (adaptiveEvaluationId nulo)
    const session = await prisma.dynamicSession.findFirst({
        where: {
            id: sessionId,
            studentId,
            adaptiveEvaluationId: { equals: null as any }
        }
    });

    if (!session) {
        throw new Error("Sesión no encontrada o no tienes permisos.");
    }

    // Delete child records first if cascading isn't fully configured
    await prisma.dynamicSessionAnswer.deleteMany({
        where: { dynamicSessionId: sessionId }
    });

    await prisma.dynamicSession.delete({
        where: { id: sessionId }
    });

    revalidatePath("/student");
}
