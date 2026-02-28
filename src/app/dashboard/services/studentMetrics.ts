import prisma from "@/lib/prisma";

export interface StudentMetricFlags {
    isCheatingRisk: boolean;
    isBurnoutRisk: boolean;
    isStruggling: boolean;
    isExcelling: boolean;
}

export interface AreaPerformance {
    area: string;
    totalAttempted: number;
    totalCorrect: number;
    accuracy: number;
    avgTimeMs: number;
}

export interface StudentMetricsSnapshot {
    studentId: string;
    totalEvaluations: number;
    totalPracticeSessions: number;
    overallAccuracy: number;
    avgTimePerQuestionMs: number;
    strongestArea: string | null;
    weakestArea: string | null;
    performanceByArea: AreaPerformance[];
    flags: StudentMetricFlags;
}

export async function getStudentMetrics(studentId: string): Promise<StudentMetricsSnapshot> {
    // 1. Fetch all static evaluation results
    const results = await prisma.result.findMany({
        where: { studentId },
        include: { answers: { include: { question: true } } }
    });

    // 2. Fetch all dynamic/practice sessions
    const sessions = await prisma.dynamicSession.findMany({
        where: { studentId },
        include: { answers: { include: { question: true } } }
    });

    let totalAnswered = 0;
    let totalCorrect = 0;
    let totalTimeSpentMs = 0;
    let answersWithTime = 0;

    // Fast answering threshold for cheating (e.g. < 4 seconds for complex questions)
    let suspiciouslyFastAnswers = 0;

    const areaStats: Record<string, { attempted: number, correct: number, timeMs: number, timeCount: number }> = {};

    // Analyze Result Answers (Static)
    // Note: Currently static results might not track individual 'time spent per answer', 
    // but they contribute to accuracy and area stats.
    results.forEach(res => {
        res.answers.forEach(ans => {
            if (!ans.question) return;
            totalAnswered++;
            if (ans.isCorrect) totalCorrect++;

            const area = ans.question.area;
            if (!areaStats[area]) areaStats[area] = { attempted: 0, correct: 0, timeMs: 0, timeCount: 0 };
            areaStats[area].attempted++;
            if (ans.isCorrect) areaStats[area].correct++;
        });
    });

    // Analyze Dynamic Session Answers (Adaptive)
    sessions.forEach(sess => {
        sess.answers.forEach(ans => {
            if (!ans.question) return;
            totalAnswered++;
            if (ans.isCorrect) totalCorrect++;

            const area = ans.question.area;
            if (!areaStats[area]) areaStats[area] = { attempted: 0, correct: 0, timeMs: 0, timeCount: 0 };
            areaStats[area].attempted++;
            if (ans.isCorrect) areaStats[area].correct++;

            // Calculate time spent (if available) - assuming answeredAt and presentedAt are close or tracked.
            // For V1, we simulate based on session duration if individual answer time isn't perfect,
            // or we use a fallback. We know the API passes `timeSpentMs`, we should ideally save it.
            // Since we didn't add timeSpentMs to DB yet, we can approximate or skip for now,
            // or use answeredAt - presentedAt if they are different.
            if (ans.answeredAt && ans.presentedAt) {
                const timeDiff = ans.answeredAt.getTime() - ans.presentedAt.getTime();
                if (timeDiff > 0 && timeDiff < 1000 * 60 * 10) { // sanity check, < 10 mins
                    totalTimeSpentMs += timeDiff;
                    answersWithTime++;
                    areaStats[area].timeMs += timeDiff;
                    areaStats[area].timeCount++;

                    if (timeDiff < 4000 && ans.isCorrect) {
                        suspiciouslyFastAnswers++;
                    }
                }
            }
        });
    });

    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    const avgTimePerQuestionMs = answersWithTime > 0 ? (totalTimeSpentMs / answersWithTime) : 0;

    const performanceByArea: AreaPerformance[] = Object.entries(areaStats).map(([area, stats]) => ({
        area,
        totalAttempted: stats.attempted,
        totalCorrect: stats.correct,
        accuracy: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0,
        avgTimeMs: stats.timeCount > 0 ? (stats.timeMs / stats.timeCount) : 0
    })).filter(a => a.totalAttempted > 3); // Must have at least a few attempts to count

    performanceByArea.sort((a, b) => b.accuracy - a.accuracy);

    const strongestArea = performanceByArea.length > 0 ? performanceByArea[0].area : null;
    const weakestArea = performanceByArea.length > 0 ? performanceByArea[performanceByArea.length - 1].area : null;

    // Define Flags
    const flags: StudentMetricFlags = {
        isCheatingRisk: suspiciouslyFastAnswers > 5 && overallAccuracy > 80, // High accuracy with many <4s answers
        isBurnoutRisk: sessions.filter(s => s.status === 'COMPLETED' && s.estimatedScore && s.estimatedScore < 30).length >= 3, // Failing multiple sessions terribly
        isStruggling: totalAnswered > 20 && overallAccuracy < 40,
        isExcelling: totalAnswered > 20 && overallAccuracy > 85
    };

    return {
        studentId,
        totalEvaluations: results.length,
        totalPracticeSessions: sessions.length,
        overallAccuracy: Math.round(overallAccuracy),
        avgTimePerQuestionMs,
        strongestArea,
        weakestArea,
        performanceByArea,
        flags
    };
}
