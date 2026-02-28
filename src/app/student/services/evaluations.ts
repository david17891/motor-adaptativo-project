import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export async function getStudentEvaluations(currentUser: any) {
    const unassignedGroupsIds = currentUser.groupMemberships.map((gm: any) => gm.groupId);

    const [myEvaluations, myAdaptiveEvaluations, myPracticeSessions, allQuestions] = await Promise.all([
        prisma.evaluation.findMany({
            where: { groupId: { in: unassignedGroupsIds } },
            include: {
                examVersion: true,
                results: { where: { studentId: currentUser.id } }
            },
            orderBy: { endDate: 'asc' }
        }),
        prisma.adaptiveEvaluation.findMany({
            where: { groupId: { in: unassignedGroupsIds } },
            include: {
                dynamicSessions: { where: { studentId: currentUser.id } }
            },
            orderBy: { endDate: 'asc' }
        }),
        prisma.dynamicSession.findMany({
            where: {
                studentId: currentUser.id,
                adaptiveEvaluationId: { equals: null as any }
            },
            orderBy: { startedAt: 'desc' }
        }),
        prisma.question.findMany({
            select: {
                area: true,
                subarea: true,
                content: true
            }
        })
    ]);

    const pendingEvals: any[] = [];
    const pastEvals: any[] = [];
    const now = new Date();

    for (const ev of myEvaluations) {
        const hasFinished = ev.results.some((r) => r.completedAt !== null);

        if (hasFinished) {
            const completedResult = ev.results.find((r) => r.completedAt !== null);
            pastEvals.push({
                id: completedResult!.id,
                evalId: ev.id,
                title: ev.examVersion.title,
                score: completedResult!.score !== null ? `${completedResult!.score} / 100` : "Pendiente",
                passed: completedResult!.score !== null ? completedResult!.score >= 60 : false,
                date: formatDistanceToNow(completedResult!.completedAt!, { addSuffix: true, locale: es })
            });
        } else {
            const isCurrentlyActive = ev.startDate <= now && ev.endDate >= now;
            const isMissed = ev.endDate < now;

            if (isCurrentlyActive) {
                const inProgressResult = ev.results.find((r) => r.completedAt === null);

                pendingEvals.push({
                    id: ev.id,
                    title: ev.examVersion.title,
                    code: ev.examVersion.versionCode,
                    deadline: formatDistanceToNow(ev.endDate, { addSuffix: true, locale: es }),
                    durationMinutes: ev.durationMinutes,
                    status: inProgressResult ? "in_progress" : "open"
                });
            } else if (isMissed) {
                pastEvals.push({
                    id: `missed-${ev.id}`,
                    evalId: ev.id,
                    title: ev.examVersion.title,
                    score: "Missed",
                    passed: false,
                    date: "Venció " + formatDistanceToNow(ev.endDate, { addSuffix: true, locale: es })
                });
            }
        }
    }

    for (const aEv of myAdaptiveEvaluations) {
        const session = aEv.dynamicSessions[0];
        const isCompleted = session?.status === "COMPLETED";

        if (isCompleted) {
            pastEvals.push({
                id: session.id,
                evalId: aEv.id,
                title: aEv.title,
                score: `${Math.round(session.estimatedScore || 0)} / 100`,
                passed: (session.estimatedScore || 0) >= 60,
                date: formatDistanceToNow(session.completedAt!, { addSuffix: true, locale: es }),
                isAdaptive: true
            });
        } else {
            const isCurrentlyActive = aEv.startDate <= now && aEv.endDate >= now;
            const isMissed = aEv.endDate < now;

            if (isCurrentlyActive) {
                pendingEvals.push({
                    id: aEv.id,
                    title: aEv.title,
                    code: `${aEv.targetArea} (Multi-nivel)`,
                    deadline: formatDistanceToNow(aEv.endDate, { addSuffix: true, locale: es }),
                    durationMinutes: aEv.durationMinutes,
                    status: session ? "in_progress" : "open",
                    isAdaptive: true
                });
            } else if (isMissed) {
                pastEvals.push({
                    id: `missed-adaptive-${aEv.id}`,
                    evalId: aEv.id,
                    title: aEv.title,
                    score: "Missed",
                    passed: false,
                    date: "Venció " + formatDistanceToNow(aEv.endDate, { addSuffix: true, locale: es }),
                    isAdaptive: true
                });
            }
        }
    }

    for (const pSession of myPracticeSessions) {
        const isCompleted = pSession.status === "COMPLETED";
        const practiceArea = pSession.practiceArea || "General";
        const practiceSubarea = pSession.practiceSubarea;
        const title = practiceSubarea ? `Práctica: ${practiceArea} - ${practiceSubarea}` : `Práctica: ${practiceArea}`;

        if (isCompleted) {
            pastEvals.push({
                id: pSession.id,
                evalId: pSession.id,
                title: title,
                score: `${Math.round(pSession.estimatedScore || 0)} / 100`,
                passed: (pSession.estimatedScore || 0) >= 60,
                date: formatDistanceToNow(pSession.completedAt!, { addSuffix: true, locale: es }),
                isAdaptive: true,
                isPractice: true
            });
        } else {
            pendingEvals.push({
                id: pSession.id,
                title: title,
                code: "Auto-generado",
                deadline: "Sin límite",
                durationMinutes: (pSession as any).durationMinutes,
                status: "in_progress",
                isAdaptive: true,
                isPractice: true
            });
        }
    }

    const areasObj: Record<string, string[]> = {};
    allQuestions.forEach((q) => {
        if (!q.area) return;
        if (!areasObj[q.area]) areasObj[q.area] = [];

        const normalize = (text: string) => text.trim().replace(/\s+/g, ' ');

        if (q.subarea) {
            const sub = normalize(q.subarea);
            if (!areasObj[q.area].includes(sub)) areasObj[q.area].push(sub);
        }

        const qContent = q.content as any;
        if (qContent && Array.isArray(qContent.topics)) {
            qContent.topics.forEach((t: string) => {
                if (typeof t === 'string' && t.trim()) {
                    const topic = normalize(t);
                    if (!areasObj[q.area].includes(topic)) areasObj[q.area].push(topic);
                }
            });
        }
    });

    return {
        pendingEvals,
        pastEvals,
        areasObj
    };
}
