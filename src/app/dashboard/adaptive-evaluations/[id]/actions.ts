"use server";

import prisma from "@/lib/prisma";

export async function fetchLiveSessionsData(evaluationId: string) {
    try {
        const evaluation = await prisma.adaptiveEvaluation.findUnique({
            where: { id: evaluationId },
            include: {
                dynamicSessions: {
                    select: {
                        studentId: true,
                        status: true,
                        currentLevel: true,
                        estimatedScore: true,
                        _count: {
                            select: { answers: true }
                        }
                    }
                }
            }
        });

        if (!evaluation) {
            return { error: "Evaluación no encontrada" };
        }

        return { sessions: evaluation.dynamicSessions };
    } catch (e: any) {
        return { error: e.message };
    }
}
