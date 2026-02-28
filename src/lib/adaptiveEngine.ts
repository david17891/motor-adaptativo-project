import prisma from "./prisma";

// Niveles de dificultad permitidos por el algoritmo V1
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 3;
export const MAX_CONSECUTIVE_FAILURES_LEVEL_1 = 3;

/**
 * Representa el resultado de la solicitud al motor
 */
export interface EngineResponse {
    isFinished: boolean;
    nextQuestion?: any; // The Question object + meta
    finalScore?: number;
    reason?: string;
}

/**
 * Evalúa una respuesta, actualiza la base de datos y determina si el estudiante debe subir o bajar de nivel
 */
export async function submitAdaptiveAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionId: string | null,
    isCorrect: boolean,
    timeSpentMs: number,
    usedHint: boolean = false
) {
    const session = await prisma.dynamicSession.findUnique({
        where: { id: sessionId },
        include: { adaptiveEvaluation: true, answers: true }
    });

    if (!session || session.status === "COMPLETED") {
        throw new Error("Session is invalid or already completed.");
    }

    // Identificar qué "orderIndex" toca registrar
    const orderIndex = session.answers.length > 0
        ? Math.max(...session.answers.map((a: any) => a.orderIndex)) + 1
        : 1;

    // Registrar la respuesta exacta
    const newAnswer = await prisma.dynamicSessionAnswer.create({
        data: {
            dynamicSessionId: sessionId,
            questionId,
            selectedOptionId,
            isCorrect,
            orderIndex,
            answeredAt: new Date(Date.now() - 100), // Aproximación
            questionLevel: session.currentLevel,
        }
    });

    // --- LÓGICA DE DIFICULTAD Y EXPERIENCIA (XP) ---
    // Si acierta, sube de nivel (hasta el máximo) y gana XP
    // Si falla, baja de nivel (hasta el mínimo)
    let nextLevel = session.currentLevel;

    if (isCorrect) {
        nextLevel = Math.min(MAX_LEVEL, nextLevel + 1);

        // Gamification: Otorgar XP por respuesta correcta basado en la dificultad
        let xpEarned = 10 * session.currentLevel;
        if (usedHint) {
            xpEarned = Math.max(0, xpEarned - 5); // Penalización por usar pista
        }
        await prisma.user.update({
            where: { id: session.studentId },
            data: { xp: { increment: xpEarned } } as any
        });
    } else {
        nextLevel = Math.max(MIN_LEVEL, nextLevel - 1);
    }

    // Actualizar nivel de la sesión
    await prisma.dynamicSession.update({
        where: { id: sessionId },
        data: { currentLevel: nextLevel }
    });

    return newAnswer;
}

/**
 * Consulta el estado actual de la sesión y arroja la siguiente pregunta del banco.
 * Si ya se completó el MÁXIMO de preguntas, calcula la calificación y cierra la sesión.
 * Si el estudiante falló consecutivamente 3 veces en Nivel 1, también cierra por "Burnout".
 */
export async function getNextAdaptiveQuestion(sessionId: string): Promise<EngineResponse> {
    const session = await prisma.dynamicSession.findUnique({
        where: { id: sessionId },
        include: {
            adaptiveEvaluation: true,
            answers: {
                include: { question: true },
                orderBy: { orderIndex: 'asc' }
            }
        }
    });

    if (!session) throw new Error("Session not found");
    if (session.status === "COMPLETED") {
        return { isFinished: true, finalScore: session.estimatedScore ?? 0, reason: "Ya finalizada." };
    }

    const isPractice = !session.adaptiveEvaluationId;
    // Use the chose total questions from practice or the formal evaluation limit
    const maxQuestions = (session as any).totalQuestions
        || (isPractice ? 10 : session.adaptiveEvaluation?.totalQuestions)
        || 10;
    const answeredCount = session.answers.length;

    // 1. CONDICIÓN DE PARO: Llegó al límite de preguntas
    if (answeredCount >= maxQuestions) {
        return await finalizeSession(session.id, "Completó todos los reactivos");
    }

    // 2. CONDICIÓN DE PARO: Burnout (Falló N veces consecutivas en Nivel 1)
    if (answeredCount >= MAX_CONSECUTIVE_FAILURES_LEVEL_1) {
        const lastThree = session.answers.slice(-MAX_CONSECUTIVE_FAILURES_LEVEL_1);
        const isBurnout = lastThree.every((a: any) => a.questionLevel === MIN_LEVEL && !a.isCorrect);
        if (isBurnout) {
            return await finalizeSession(session.id, "Límite de fallos consecutivos en Nivel Básico");
        }
    }

    // 3. SELECCIONAR SIGUIENTE PREGUNTA
    const askedQuestionIds = session.answers.map((a: any) => a.questionId);
    const askedQuestionTexts = session.answers.map((a: any) => {
        const content = (a.question as any)?.content;
        return content?.text || content?.html || "";
    }).filter(t => t !== "");

    // Determinar campos de búsqueda según si es práctica o asignación formal
    const searchArea = isPractice ? (session as any).practiceArea! : session.adaptiveEvaluation!.targetArea;
    const searchSubarea = isPractice ? (session as any).practiceSubarea : session.adaptiveEvaluation!.targetSubarea;

    console.log(`[Engine] Session: ${sessionId} | Area: ${searchArea} | Level: ${session.currentLevel} | Asked: ${askedQuestionIds.length}`);

    // Fetch candidate questions from the DB by area, level, and that haven't been asked
    let allMatchingQuestions: any[] = [];

    // --- LÓGICA DE REPASO ESPACIADO ---
    if (searchArea === "Repaso Espaciado") {
        // Encontrar preguntas que el usuario ha fallado históricamente (DynamicSessionAnswer)
        const failedAnswers = await prisma.dynamicSessionAnswer.findMany({
            where: {
                dynamicSession: { studentId: session.studentId },
                isCorrect: false
            },
            select: { questionId: true },
            distinct: ['questionId']
        });
        const failedIds = failedAnswers
            .map(f => f.questionId)
            .filter(id => !askedQuestionIds.includes(id));

        console.log(`[Engine] Spaced Repetition: ${failedIds.length} failed questions remaining to review.`);

        // Si no hay preguntas falladas y es la primera pregunta de la sesión
        if (failedIds.length === 0 && askedQuestionIds.length === 0) {
            await prisma.dynamicSession.update({
                where: { id: sessionId },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                    estimatedScore: 100
                }
            });
            return {
                isFinished: true,
                finalScore: 100,
                reason: "¡Felicidades! No tienes errores por repasar en este momento."
            };
        }

        allMatchingQuestions = await prisma.question.findMany({
            where: {
                id: { in: failedIds },
                difficultyLevel: session.currentLevel // Mantener control de dificultad
            }
        });

        // Si ya no le quedan falladas de este nivel, buscar falladas de cualquier nivel
        if (allMatchingQuestions.length === 0) {
            allMatchingQuestions = await prisma.question.findMany({
                where: {
                    id: { in: failedIds },
                    // IMPORTANTE: Asegurarnos de no repetir preguntas incluso en el fallback de nivel
                }
            });
            // El filtro de !askedQuestionIds ya se aplicó al generar failedIds arriba (línea 144)
        }
    } else {
        // --- LÓGICA NORMAL ---
        allMatchingQuestions = await prisma.question.findMany({
            where: {
                area: searchArea,
                difficultyLevel: session.currentLevel,
                id: { notIn: askedQuestionIds } // No repetir preguntas
            }
        });
    }

    let candidateQuestions = allMatchingQuestions;

    // Apply advanced subarea/topic filtering in memory if searchSubarea is defined and it's not spaced repetition
    if (searchSubarea && searchSubarea.trim() !== '' && searchArea !== "Repaso Espaciado") {
        const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const topicsList = searchSubarea
            .split(',')
            .map((t: string) => normalizeText(t))
            .filter((t: string) => t.length > 0);

        if (topicsList.length > 0) {
            candidateQuestions = allMatchingQuestions.filter((q: any) => {
                // Check against the literal `subarea` column
                const normalizedSubarea = q.subarea ? normalizeText(q.subarea) : "";
                const matchesSubareaColumn = topicsList.some((t: string) => normalizedSubarea.includes(t));

                // Check against the `topics` array inside the `content` JSON
                const qTopicsRaw = (q.content as any)?.topics || [];
                const qTopicsNormalized = qTopicsRaw.map((qt: string) => normalizeText(qt));
                const matchesTopicsJson = qTopicsNormalized.some((qt: string) =>
                    topicsList.some((tl: string) => qt.includes(tl) || tl.includes(qt))
                );

                return matchesSubareaColumn || matchesTopicsJson;
            });
        }
    }

    // EXPLICIT CONTENT DEDUPLICATION: Remove any question that has the same text as one already asked
    candidateQuestions = candidateQuestions.filter((q: any) => {
        const content = (q.content as any);
        const text = content?.text || content?.html || "";
        return !askedQuestionTexts.includes(text);
    });

    if (candidateQuestions.length === 0) {
        // Fallback 1: Relajar filtro de subtema y buscar solo por área y nivel
        candidateQuestions = allMatchingQuestions.filter((q: any) => {
            const content = (q.content as any);
            const text = content?.text || content?.html || "";
            return !askedQuestionTexts.includes(text);
        });

        if (candidateQuestions.length === 0) {
            // Fallback 2: Relajar nivel, buscar cualquier pregunta del área que no se haya hecho
            let fallbackQuestions = [];
            if (searchArea === "Repaso Espaciado") {
                const failedAnswers = await prisma.dynamicSessionAnswer.findMany({
                    where: { dynamicSession: { studentId: session.studentId }, isCorrect: false },
                    select: { questionId: true }, distinct: ['questionId']
                });
                const failedIds = failedAnswers.map((f: any) => f.questionId).filter((id: string) => !askedQuestionIds.includes(id));
                fallbackQuestions = await prisma.question.findMany({ where: { id: { in: failedIds } } });
            } else {
                fallbackQuestions = await prisma.question.findMany({
                    where: { area: searchArea, id: { notIn: askedQuestionIds } }
                });
            }

            // Apply content deduplication to fallback questions too
            fallbackQuestions = fallbackQuestions.filter((q: any) => {
                const content = (q.content as any);
                const text = content?.text || content?.html || "";
                return !askedQuestionTexts.includes(text);
            });

            if (fallbackQuestions.length === 0) {
                // Si de plano ya no hay preguntas, terminamos.
                return await finalizeSession(session.id, "Bolsa de reactivos agotada");
            }
            candidateQuestions = fallbackQuestions;
        }
    }

    // Seleccionar una al azar
    const randomIndex = Math.floor(Math.random() * candidateQuestions.length);
    const selectedQuestion = candidateQuestions[randomIndex];

    return {
        isFinished: false,
        nextQuestion: selectedQuestion,
    };
}

/**
 * Cierra la sesión, calcula el puntaje basado en la dificultad superada y retorna
 */
export async function finalizeSession(sessionId: string, reason: string): Promise<EngineResponse> {
    const session = await prisma.dynamicSession.findUnique({
        where: { id: sessionId },
        include: { answers: true }
    });

    if (!session) throw new Error("Session not found");

    // LÓGICA DE CALIFICACIÓN (Ejemplo básico ponderado)
    // Nivel 1 = 1 punto, Nivel 2 = 2 puntos, Nivel 3 = 3 puntos
    // MaxPuntos = si todas hubieran sido Nivel 3 y aciertos.

    // Como es adaptativo clásico V1, promediaremos el desempeño ajustado por nivel.
    // Un alumno que llega a Nivel 3 es mejor que uno en Nivel 1.
    // Score final = Base + (Promedio de niveles acertados)

    const maxScorePerQuestion = 3;
    let obtainedPoints = 0;
    let expectedPoints = 0;

    session.answers.forEach((ans: any) => {
        expectedPoints += ans.questionLevel; // El máximo posible para este alumno fue la suma de niveles presentados
        if (ans.isCorrect) {
            obtainedPoints += ans.questionLevel; // Vale más si acierta nivel 3
        }
    });

    const calculatedScore = Math.min(100, Math.round((obtainedPoints / expectedPoints) * 100));

    // --- LÓGICA DE GAMIFICACIÓN: RACHA Y BONO XP ---
    const user = await prisma.user.findUnique({ where: { id: session.studentId } });
    if (user) {
        let newStreak = (user as any).currentStreak || 0;
        let newLastActive = (user as any).lastActiveDate || new Date(0);
        const todayStr = new Date().toISOString().split('T')[0];
        const lastActiveStr = newLastActive.toISOString().split('T')[0];

        if (todayStr !== lastActiveStr) {
            // Check if it was exactly yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActiveStr === yesterdayStr) {
                newStreak += 1;
            } else {
                newStreak = 1; // Lost streak, reset to 1
            }
            newLastActive = new Date();
        }

        const completionBonusXp = calculatedScore >= 60 ? 50 : 20;

        await prisma.user.update({
            where: { id: session.studentId },
            data: {
                currentStreak: newStreak,
                lastActiveDate: newLastActive,
                xp: { increment: completionBonusXp }
            } as any
        });
    }

    await prisma.dynamicSession.update({
        where: { id: sessionId },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
            estimatedScore: calculatedScore
        }
    });

    return {
        isFinished: true,
        finalScore: calculatedScore,
        reason
    };
}
