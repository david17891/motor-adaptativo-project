"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function saveAnswer(resultId: string, questionId: string, selectedOptionId: string) {
    const c = await cookies();
    const studentId = c.get("studentToken")?.value;
    if (!studentId) return;

    // Verificar seguridad: Que el resultId realmente sea de este estudiante y no esté completado
    const result = await prisma.result.findUnique({
        where: { id: resultId, studentId: studentId }
    });
    if (!result || result.completedAt) return;

    // Obtener la pregunta y buscar la opción correcta
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return;

    const options = question.options as any[];
    const correctOption = options.find((opt: any) => opt.is_correct === true);
    const isCorrect = selectedOptionId ? (selectedOptionId === correctOption?.id) : false;

    await prisma.resultAnswer.upsert({
        where: { resultId_questionId: { resultId, questionId } },
        update: { selectedOptionId, isCorrect },
        create: { resultId, questionId, selectedOptionId, isCorrect }
    });
}

export async function submitEvaluation(resultId: string, answers: Record<string, string>) {
    const c = await cookies();
    const studentId = c.get("studentToken")?.value;

    if (!studentId) {
        return { error: "Sesión inválida." };
    }

    // Verificar que el result pertenece al alumno y no está completado
    const result = await prisma.result.findUnique({
        where: { id: resultId },
        include: {
            evaluation: {
                include: {
                    examVersion: {
                        include: {
                            questions: {
                                include: { question: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!result || result.studentId !== studentId) {
        return { error: "Evaluación no encontrada o no autorizada." };
    }

    if (result.completedAt) {
        return { error: "Esta evaluación ya fue enviada previamente." };
    }

    const examQuestions = result.evaluation.examVersion.questions;
    const totalQuestions = examQuestions.length;
    let correctCount = 0;

    const resultAnswersData = [];

    // Evaluar cada pregunta
    for (const eq of examQuestions) {
        const qId = eq.questionId;
        const selectedOptionId = answers[qId] || null;

        // Buscar qué opción es la correcta en la DB
        const options = eq.question.options as any[];
        const correctOption = options.find((opt: any) => opt.is_correct === true);

        const isCorrect = selectedOptionId ? (selectedOptionId === correctOption?.id) : false;

        if (isCorrect) correctCount++;

        resultAnswersData.push({
            resultId: result.id,
            questionId: qId,
            selectedOptionId: selectedOptionId,
            isCorrect: isCorrect
        });
    }

    // Guardar respuestas granulares por transacción
    await prisma.$transaction(
        resultAnswersData.map(data =>
            prisma.resultAnswer.upsert({
                where: { resultId_questionId: { resultId: data.resultId, questionId: data.questionId } },
                update: { selectedOptionId: data.selectedOptionId, isCorrect: data.isCorrect },
                create: data
            })
        )
    );

    // Calcular score final (0 a 100)
    const finalScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Actualizar el Result
    await prisma.result.update({
        where: { id: result.id },
        data: {
            score: finalScore,
            completedAt: new Date()
        }
    });

    revalidatePath("/student");
    return { success: true, url: `/student/results/${result.id}` };
}
