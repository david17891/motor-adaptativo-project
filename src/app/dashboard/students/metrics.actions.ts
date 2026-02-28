"use server";

import prisma from "@/lib/prisma";

export async function getStudentEngagementStats(studentId: string) {
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: {
            currentStreak: true,
            level: true,
            xp: true,
            lastActiveDate: true,
        }
    });

    if (!student) throw new Error("Student not found");

    // Calcular días inactivos
    const today = new Date();
    const lastActive = student.lastActiveDate ? new Date(student.lastActiveDate) : null;
    let daysInactive = null;

    if (lastActive) {
        const diffTime = Math.abs(today.getTime() - lastActive.getTime());
        daysInactive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Volumen de práctica en los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const practiceVolume = await prisma.dynamicSession.count({
        where: {
            studentId,
            completedAt: {
                gte: sevenDaysAgo
            }
        }
    });

    return {
        ...student,
        daysInactive,
        practiceVolumeLast7Days: practiceVolume
    };
}

export async function getStudentKnowledgeGaps(studentId: string) {
    // Rendimiento Histórico agrupado por Area y Subarea
    const answers = await prisma.dynamicSessionAnswer.findMany({
        where: {
            dynamicSession: {
                studentId,
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

    const performanceData = Array.from(performanceMap.entries()).map(([key, data]) => {
        return {
            topic: key,
            total: data.total,
            correct: data.correct,
            percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0
        };
    }).sort((a, b) => a.percentage - b.percentage); // Ordenar de peor a mejor

    return performanceData;
}

export async function detectStudentAnomalies(studentId: string) {
    // Alerta de "Adivinación a ciegas" (Speed Guessing): Respuestas < 5s que son INCORRECTAS
    // Alerta de "Posible Copia" (Speed Cheating): Respuestas < 10s que son CORRECTAS en Nivel > 3

    const SPEED_GUESSING_THRESHOLD_MS = 5000; // 5 segundos
    const SPEED_CHEATING_THRESHOLD_MS = 10000; // 10 segundos
    const HIGH_DIFFICULTY_THRESHOLD = 3;

    const answers = await prisma.dynamicSessionAnswer.findMany({
        where: {
            dynamicSession: {
                studentId
            },
            answeredAt: { not: undefined } as any,
            presentedAt: { not: undefined } as any
        },
        orderBy: {
            answeredAt: 'desc'
        },
        take: 100 // Analizar solo las últimas 100 respuestas para rendimiento
    });

    let speedGuessingCount = 0;
    let speedCheatingCount = 0;

    answers.forEach(ans => {
        if (!ans.answeredAt || !ans.presentedAt) return;

        const timeTakenMs = ans.answeredAt.getTime() - ans.presentedAt.getTime();

        if (timeTakenMs < SPEED_GUESSING_THRESHOLD_MS && !ans.isCorrect) {
            speedGuessingCount++;
        }

        if (timeTakenMs < SPEED_CHEATING_THRESHOLD_MS && ans.isCorrect && ans.questionLevel > HIGH_DIFFICULTY_THRESHOLD) {
            speedCheatingCount++;
        }
    });

    return {
        speedGuessingAlerts: speedGuessingCount,
        speedCheatingAlerts: speedCheatingCount,
        totalAnalyzed: answers.length
    };
}

export async function getGlobalStudentAlerts() {
    // 1. Obtener a todos los alumnos
    const students = await prisma.user.findMany({
        where: { role: "ALUMNO" },
        select: { id: true, nombre: true, apellidos: true, currentStreak: true, lastActiveDate: true }
    });

    const alerts = [];

    // 2. Analizar inactividad prolongada (Burnout / Abandono)
    const today = new Date();
    const INACTIVITY_THRESHOLD_DAYS = 7;

    for (const student of students) {
        if (student.lastActiveDate) {
            const diffTime = Math.abs(today.getTime() - student.lastActiveDate.getTime());
            const daysInactive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysInactive >= INACTIVITY_THRESHOLD_DAYS) {
                alerts.push({
                    studentId: student.id,
                    studentName: `${student.nombre} ${student.apellidos}`,
                    type: "INACTIVITY",
                    severity: daysInactive > 14 ? "HIGH" : "MEDIUM",
                    message: `Inactivo por ${daysInactive} días.`
                });
            }
        }

        // 3. Obtener anomalías específicas del estudiante (Speed Guessing)
        // Optimizaremos pidiendo solo las sesiones recientes para no ahogar la BD
        const recentAnswers = await prisma.dynamicSessionAnswer.findMany({
            where: {
                dynamicSession: { studentId: student.id },
                answeredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Últimos 7 días
            },
            take: 50,
            orderBy: { answeredAt: 'desc' }
        });

        let guessCount = 0;
        recentAnswers.forEach(ans => {
            if (!ans.answeredAt || !ans.presentedAt) return;
            const timeTaken = ans.answeredAt.getTime() - ans.presentedAt.getTime();
            if (timeTaken < 5000 && !ans.isCorrect) guessCount++;
        });

        if (guessCount >= 5) {
            alerts.push({
                studentId: student.id,
                studentName: `${student.nombre} ${student.apellidos}`,
                type: "SPEED_GUESSING",
                severity: guessCount > 10 ? "HIGH" : "MEDIUM",
                message: `Constante adivinación rápida. ${guessCount} errores rápidos recientes.`
            });
        }
    }

    return alerts.sort((a, b) => (a.severity === "HIGH" ? -1 : 1));
}
