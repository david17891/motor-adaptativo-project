"use server";

import prisma from "@/lib/prisma";

export async function getGroupHeatmapData(groupId: string) {
    // Rendimiento Histórico agrupado por Area y Subarea para todo el grupo
    const answers = await prisma.dynamicSessionAnswer.findMany({
        where: {
            dynamicSession: {
                student: {
                    groupMemberships: {
                        some: { groupId }
                    }
                },
                status: "COMPLETED"
            }
        },
        include: {
            question: {
                select: {
                    area: true,
                    subarea: true
                }
            }
        }
    });

    const performanceMap = new Map<string, { total: number, correct: number }>();

    answers.forEach(ans => {
        const area = ans.question.area || 'Desconocida';
        const subarea = ans.question.subarea || 'General';
        const key = `${area} - ${subarea}`;

        const current = performanceMap.get(key) || { total: 0, correct: 0 };
        current.total += 1;
        if (ans.isCorrect) current.correct += 1;

        performanceMap.set(key, current);
    });

    const heatmapData = Array.from(performanceMap.entries()).map(([key, data]) => {
        return {
            topic: key,
            total: data.total,
            correct: data.correct,
            percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0
        };
    }).sort((a, b) => b.percentage - a.percentage); // Ordenar de mejor a peor para el heatmap

    return heatmapData;
}

export async function getAtRiskStudents(groupId: string) {
    // Alumnos en Riesgo: Baja actividad o alertas
    const members = await prisma.groupMember.findMany({
        where: { groupId },
        include: {
            student: {
                select: {
                    id: true,
                    nombre: true,
                    apellidos: true,
                    lastActiveDate: true,
                    currentStreak: true,
                    dynamicSessions: {
                        where: { status: "COMPLETED" },
                        select: {
                            estimatedScore: true,
                            answers: {
                                select: {
                                    isCorrect: true,
                                    presentedAt: true,
                                    answeredAt: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const today = new Date();

    const atRiskStudents = members.map(member => {
        const student = member.student;

        // Calcular días inactivos
        const lastActive = student.lastActiveDate ? new Date(student.lastActiveDate) : null;
        let daysInactive = 0;
        if (lastActive) {
            const diffTime = Math.abs(today.getTime() - lastActive.getTime());
            daysInactive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
            daysInactive = 999; // Nunca activo
        }

        // Analizar sesiones para encontrar banderas
        let totalAnswered = 0;
        let totalCorrect = 0;
        let suspiciouslyFastAnswers = 0;
        const failedSessions = student.dynamicSessions.filter(s => s.estimatedScore && s.estimatedScore < 30).length;

        student.dynamicSessions.forEach(session => {
            session.answers.forEach(ans => {
                totalAnswered++;
                if (ans.isCorrect) totalCorrect++;

                if (ans.answeredAt && ans.presentedAt) {
                    const timeTakenMs = ans.answeredAt.getTime() - ans.presentedAt.getTime();
                    if (timeTakenMs < 4000 && ans.isCorrect) {
                        suspiciouslyFastAnswers++;
                    }
                }
            });
        });

        const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

        const isCheatingRisk = suspiciouslyFastAnswers > 5 && overallAccuracy > 80;
        const isBurnoutRisk = failedSessions >= 3;
        const isStruggling = totalAnswered > 20 && overallAccuracy < 40;
        const isActiveDaysWarning = daysInactive > 7;

        return {
            id: student.id,
            nombre: student.nombre,
            apellidos: student.apellidos,
            daysInactive,
            streak: student.currentStreak,
            flags: {
                isCheatingRisk,
                isBurnoutRisk,
                isStruggling,
                isActiveDaysWarning
            },
            isAtRisk: isCheatingRisk || isBurnoutRisk || isStruggling || isActiveDaysWarning
        };
    }).filter(s => s.isAtRisk); // Solo devolver los que están en riesgo

    return atRiskStudents;
}
