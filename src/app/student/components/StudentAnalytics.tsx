import prisma from "@/lib/prisma";
import StudentCharts from "./StudentCharts";

export default async function StudentAnalytics({ studentId }: { studentId: string }) {
    // 1. Fetch data from Fixed Exams (Evaluation Results)
    const resultAnswers = await prisma.resultAnswer.findMany({
        where: {
            result: { studentId }
        },
        include: {
            question: { select: { area: true, subarea: true, difficultyLevel: true, content: true } }
        }
    });

    // 2. Fetch data from Adaptive Exams and Free Practice
    const dynamicAnswers = await prisma.dynamicSessionAnswer.findMany({
        where: {
            dynamicSession: { studentId }
        },
        include: {
            question: { select: { area: true, subarea: true, content: true } }
        }
    });

    if (resultAnswers.length === 0 && dynamicAnswers.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 shadow-sm">
                No hay suficientes datos de respuestas aún para generar tus estadísticas de dominio. ¡Comienza una práctica para llenarlo!
            </div>
        );
    }

    // --- AGGREGATION LOGIC ---

    // A. Area Mastery (Radar Chart)
    const areaStats: Record<string, { total: number, correct: number }> = {};

    // B. Accuracy by Difficulty (Bar Chart)
    const difficultyStats: Record<number, { total: number, correct: number }> = {
        1: { total: 0, correct: 0 },
        2: { total: 0, correct: 0 },
        3: { total: 0, correct: 0 }
    };

    // C. Subarea/Topic Accuracy (Strengths & Weaknesses)
    const subareaStats: Record<string, { total: number, correct: number, area: string }> = {};

    const processAnswer = (area: string, subarea: string | null, isCorrect: boolean, diff: number) => {
        // Area
        if (!areaStats[area]) areaStats[area] = { total: 0, correct: 0 };
        areaStats[area].total++;
        if (isCorrect) areaStats[area].correct++;

        // Difficulty
        if (difficultyStats[diff]) {
            difficultyStats[diff].total++;
            if (isCorrect) difficultyStats[diff].correct++;
        }

        // Subarea
        if (subarea) {
            const key = `${area}: ${subarea}`; // Use area prefix to avoid collisions
            if (!subareaStats[key]) subareaStats[key] = { total: 0, correct: 0, area };
            subareaStats[key].total++;
            if (isCorrect) subareaStats[key].correct++;
        }
    };

    resultAnswers.forEach(ans => processAnswer(ans.question.area, ans.question.subarea, ans.isCorrect, ans.question.difficultyLevel));
    dynamicAnswers.forEach(ans => processAnswer(ans.question.area, ans.question.subarea, ans.isCorrect, ans.questionLevel));

    // Prepare Radar Data
    const radarData = Object.keys(areaStats).map(area => ({
        subject: area,
        A: Math.round((areaStats[area].correct / areaStats[area].total) * 100),
        fullMark: 100
    })).filter(x => x.A > 0); // Only show if they've answered at least something correctly or tried there

    // Prepare Difficulty Data
    const barData = [
        { name: 'Nivel 1 (Fácil)', Exactitud: difficultyStats[1].total > 0 ? Math.round((difficultyStats[1].correct / difficultyStats[1].total) * 100) : 0, TotalIntento: difficultyStats[1].total },
        { name: 'Nivel 2 (Medio)', Exactitud: difficultyStats[2].total > 0 ? Math.round((difficultyStats[2].correct / difficultyStats[2].total) * 100) : 0, TotalIntento: difficultyStats[2].total },
        { name: 'Nivel 3 (Difícil)', Exactitud: difficultyStats[3].total > 0 ? Math.round((difficultyStats[3].correct / difficultyStats[3].total) * 100) : 0, TotalIntento: difficultyStats[3].total },
    ];

    // Prepare Strengths & Weaknesses
    // Only consider subareas with at least 2 attempts to avoid 100% or 0% from a single lucky/unlucky guess
    const validSubareas = Object.entries(subareaStats)
        .filter(([_, stats]) => stats.total >= 2)
        .map(([name, stats]) => {
            const acc = (stats.correct / stats.total) * 100;
            // Clean up name by removing prefix if desired, or keep it. Let's keep just subarea name.
            const cleanName = name.split(': ')[1];
            return {
                name: cleanName,
                area: stats.area,
                accuracy: acc,
                total: stats.total
            };
        })
        .sort((a, b) => b.accuracy - a.accuracy); // Descending

    const strengths = validSubareas.filter(s => s.accuracy >= 70).slice(0, 3);
    const weaknesses = validSubareas.filter(s => s.accuracy < 60).slice().reverse().slice(0, 3);

    return (
        <StudentCharts
            radarData={radarData}
            barData={barData}
            strengths={strengths}
            weaknesses={weaknesses}
        />
    );
}
