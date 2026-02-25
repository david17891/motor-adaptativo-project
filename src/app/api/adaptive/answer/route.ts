import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getNextAdaptiveQuestion, submitAdaptiveAnswer, EngineResponse } from '@/lib/adaptiveEngine';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId, questionId, selectedOptionId, timeSpentMs } = body;

        if (!sessionId || !questionId) {
            return NextResponse.json({ error: "Faltan parámetros requeridos." }, { status: 400 });
        }

        // 1. Obtener la pregunta original para saber cuál es la opción correcta
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            return NextResponse.json({ error: "Pregunta no encontrada." }, { status: 404 });
        }

        // 2. Determinar si contestó bien (parsear options de Json)
        const options = question.options as any[];
        const correctOption = options.find(o => o.is_correct === true || o.is_correct === "true");
        const isCorrect = correctOption && correctOption.id === selectedOptionId;

        // 3. Registrar la respuesta y recalcular nivel (motor)
        await submitAdaptiveAnswer(
            sessionId,
            questionId,
            selectedOptionId,
            isCorrect,
            timeSpentMs || 0
        );

        // 4. Solicitar la siguiente pregunta al motor
        const engineResult: EngineResponse = await getNextAdaptiveQuestion(sessionId);

        // Retornamos si es fin del examen o la siguiente pregunta a pintar
        return NextResponse.json(engineResult);

    } catch (error: any) {
        console.error("Adaptive API Error:", error);
        return NextResponse.json({ error: "Error interno del servidor al procesar la respuesta." }, { status: 500 });
    }
}
