import React from 'react';
import prisma from "@/lib/prisma";
import GroupStatsReport from './GroupStatsReport';

export default async function GroupStatsContainer({ groupId, groupName }: { groupId: string, groupName: string }) {
    // 1. Members
    const groupMembers = await prisma.groupMember.findMany({
        where: { groupId },
        include: { student: { select: { level: true } } }
    });

    const studentIds = groupMembers.map(m => m.studentId);

    if (studentIds.length === 0) {
        return null; // Return null or a placeholder if no members
    }

    // Level Distribution Data
    let level1Count = 0;
    let level2Count = 0;
    let level3Count = 0;
    groupMembers.forEach(m => {
        if (m.student.level === 1) level1Count++;
        else if (m.student.level === 2) level2Count++;
        else if (m.student.level >= 3) level3Count++;
    });

    const levelData = [
        { name: 'Nivel 1 (Básico)', value: level1Count, fill: '#ef4444' },
        { name: 'Nivel 2 (Intermedio)', value: level2Count, fill: '#f59e0b' },
        { name: 'Nivel 3 (Avanzado)', value: level3Count, fill: '#10b981' },
    ].filter(l => l.value > 0);

    // 2. Fetch all answers
    const resultAnswers = await prisma.resultAnswer.findMany({
        where: { result: { studentId: { in: studentIds } } },
        include: {
            question: { select: { area: true, subarea: true } },
            result: { select: { startedAt: true } }
        }
    });

    const dynamicAnswers = await prisma.dynamicSessionAnswer.findMany({
        where: { dynamicSession: { studentId: { in: studentIds } } },
        include: { question: { select: { area: true, subarea: true } } }
    });

    // Domain Spiderweb Data
    const statsMap: Record<string, { total: number, correct: number }> = {};
    const processItem = (subarea: string | null, area: string, isCorrect: boolean) => {
        const key = subarea || area;
        if (!statsMap[key]) {
            statsMap[key] = { total: 0, correct: 0 };
        }
        statsMap[key].total++;
        if (isCorrect) statsMap[key].correct++;
    };

    resultAnswers.forEach(ans => processItem(ans.question.subarea, ans.question.area, ans.isCorrect));
    dynamicAnswers.forEach(ans => processItem(ans.question.subarea, ans.question.area, ans.isCorrect));

    const domainData = Object.entries(statsMap).map(([subject, data]) => {
        return {
            subject,
            A: Math.round((data.correct / data.total) * 100),
            fullMark: 100
        };
    }).filter(d => statsMap[d.subject].total >= 2).slice(0, 6); // Max 6 arms for a clean spiderweb

    // Historical Progress Data (Group by basic date MM-DD)
    const historyMap: Record<string, { total: number, correct: number }> = {};

    // Fallback simple dates: today if no answers
    const processDate = (dateOb: Date, isCorrect: boolean) => {
        const key = dateOb.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!historyMap[key]) historyMap[key] = { total: 0, correct: 0 };
        historyMap[key].total++;
        if (isCorrect) historyMap[key].correct++;
    };

    resultAnswers.forEach(ans => {
        if (ans.result?.startedAt) {
            processDate(ans.result.startedAt, ans.isCorrect);
        }
    });
    dynamicAnswers.forEach(ans => typeof ans.answeredAt !== "undefined" && ans.answeredAt && processDate(ans.answeredAt, ans.isCorrect));

    const historyData = Object.entries(historyMap).map(([date, data]) => {
        const [yy, mm, dd] = date.split("-");
        return {
            date: `${dd}/${mm}`,
            Promedio: Math.round((data.correct / data.total) * 100)
        }
    }).sort((a, b) => {
        // basic sort by DD/MM assuming cross year isn't top priority for fake data
        const dateA = a.date.split("/").reverse().join("");
        const dateB = b.date.split("/").reverse().join("");
        return dateA.localeCompare(dateB);
    });

    const combinedHistory = historyData.length > 0 ? historyData : [
        { date: 'Sin datos', Promedio: 0 }
    ];

    const hasData = resultAnswers.length > 0 || dynamicAnswers.length > 0;

    return (
        <GroupStatsReport
            groupName={groupName}
            levelData={levelData}
            domainData={domainData}
            historyData={combinedHistory}
            hasInteractionData={hasData}
        />
    );
}
