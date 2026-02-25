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
    timeSpentMs: number
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

    // --- LÓGICA DE DIFICULTAD ---
    // Si acierta, sube de nivel (hasta el máximo)
    // Si falla, baja de nivel (hasta el mínimo)
    let nextLevel = session.currentLevel;

    if (isCorrect) {
        nextLevel = Math.min(MAX_LEVEL, nextLevel + 1);
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
            answers: { orderBy: { orderIndex: 'asc' } }
        }
    });

    if (!session) throw new Error("Session not found");
    if (session.status === "COMPLETED") {
        return { isFinished: true, finalScore: session.estimatedScore ?? 0, reason: "Ya finalizada." };
    }

    const maxQuestions = session.adaptiveEvaluation.totalQuestions;
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

    // Fetch candidate questions from the DB by area, level, and that haven't been asked
    const allMatchingQuestions = await prisma.question.findMany({
        where: {
            area: session.adaptiveEvaluation.targetArea,
            difficultyLevel: session.currentLevel,
            id: { notIn: askedQuestionIds } // No repetir preguntas
        }
    });

    let candidateQuestions = allMatchingQuestions;

    // Apply advanced subarea/topic filtering in memory if targetSubarea is defined (comma-separated list)
    if (session.adaptiveEvaluation.targetSubarea && session.adaptiveEvaluation.targetSubarea.trim() !== '') {
        const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const topicsList = session.adaptiveEvaluation.targetSubarea
            .split(',')
            .map(t => normalizeText(t))
            .filter(t => t.length > 0);

        if (topicsList.length > 0) {
            candidateQuestions = allMatchingQuestions.filter((q: any) => {
                // Check against the literal `subarea` column
                const normalizedSubarea = q.subarea ? normalizeText(q.subarea) : "";
                const matchesSubareaColumn = topicsList.some(t => normalizedSubarea.includes(t));

                // Check against the `topics` array inside the `content` JSON
                const qTopicsRaw = (q.content as any)?.topics || [];
                const qTopicsNormalized = qTopicsRaw.map((qt: string) => normalizeText(qt));
                const matchesTopicsJson = qTopicsNormalized.some((qt: string) =>
                    topicsList.some(tl => qt.includes(tl) || tl.includes(qt))
                );

                return matchesSubareaColumn || matchesTopicsJson;
            });
        }
    }

    if (candidateQuestions.length === 0) {
        // Fallback: Si no hay suficientes preguntas en el nivel, finalizar prematuramente o relajar filtro.
        // Aquí decidimos finalizar prematuramente por falta de banco.
        return await finalizeSession(session.id, "Bolsa de reactivos agotada");
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
    let expectedPoints = session.answers.length * maxScorePerQuestion;

    if (expectedPoints === 0) {
        expectedPoints = 1; // Evitar división por cero
    }

    session.answers.forEach((ans: any) => {
        if (ans.isCorrect) {
            obtainedPoints += ans.questionLevel; // Vale más si acierta nivel 3
        }
    });

    const calculatedScore = Math.min(100, Math.round((obtainedPoints / expectedPoints) * 100));

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
