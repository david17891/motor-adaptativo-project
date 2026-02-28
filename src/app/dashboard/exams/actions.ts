"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";

export async function generateExamVersion(formData: FormData) {
    let title = formData.get("title") as string;
    let versionCode = formData.get("versionCode") as string;
    const areas = formData.getAll("areas") as string[];
    const difficultyLevel = parseInt(formData.get("difficultyLevel") as string);
    const topicsRaw = formData.getAll("topics") as string[];
    const questionCount = parseInt(formData.get("questionCount") as string);

    if (!areas || areas.length === 0) {
        return { error: "Debes seleccionar al menos un Área o Materia para el examen." };
    }

    if (!title) {
        const titleAreaString = areas.length > 2 ? `${areas.length} Materias` : areas.join(" y ");
        title = `Examen Autogenerado de ${titleAreaString} (${new Date().toLocaleDateString()})`;
    }

    if (!versionCode) {
        versionCode = `V-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    }

    if (isNaN(questionCount) || questionCount <= 0) {
        return { error: "La cantidad de preguntas es inválida." };
    }

    // helper function para normalizar textos: quita acentos y pasa a minúsculas
    const normalizeText = (text: string) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    const topicsList = topicsRaw ? topicsRaw.map(normalizeText).filter(t => t.length > 0) : [];

    try {
        // Verificar si el código de versión ya existe
        const existingVersion = await prisma.examVersion.findUnique({
            where: { versionCode }
        });

        if (existingVersion) {
            return { error: "El código de versión ya existe. Usa uno diferente (ej. V2)." };
        }

        // Obtener preguntas que coincidan con los criterios básicos (área y opcionalmente dificultad)
        const whereClause: any = {};

        if (areas.length > 0) {
            whereClause.area = { in: areas };
        }

        if (!isNaN(difficultyLevel) && difficultyLevel > 0) {
            whereClause.difficultyLevel = difficultyLevel;
        }

        // Nota: Traremos las preguntas del área y filtraremos en memoria para poder
        // comparar flexiblemente (minúsculas, sin acentos) tanto 'subarea' como el json 'topics'
        const allMatchingQuestions = await prisma.question.findMany({
            where: whereClause
        });

        let eligibleQuestions = allMatchingQuestions;

        if (topicsList.length > 0) {
            eligibleQuestions = allMatchingQuestions.filter((q: any) => {
                // Check against the literal `subarea` column if it exists
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

        if (eligibleQuestions.length < questionCount) {
            return { error: `No hay suficientes preguntas para esos subtemas. Encontramos ${eligibleQuestions.length}, pero pediste ${questionCount}. Reduce la cantidad o amplía tus filtros.` };
        }

        // Mezclar aleatoriamente y tomar la cantidad solicitada (Algoritmo Fisher-Yates shuffle simplificado)
        const shuffled = [...eligibleQuestions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, questionCount);

        // Crear la versión del examen y relacionar las preguntas mediante tabla transaccional
        await prisma.$transaction(async (tx: any) => {
            const newExam = await tx.examVersion.create({
                data: {
                    title,
                    versionCode,
                    isActive: true,
                }
            });

            // Insertar las relaciones manteniendo un orden
            const examQuestionsData = selectedQuestions.map((q, index) => ({
                examVersionId: newExam.id,
                questionId: q.id,
                orderIndex: index + 1
            }));

            await tx.examQuestion.createMany({
                data: examQuestionsData
            });
        });

        revalidatePath("/dashboard/exams");
        return { success: true };
    } catch (error: any) {
        console.error("Error generating exam:", error);
        return { error: `Error interno al generar el examen: ${error.message}` };
    }
}

export async function deleteExamVersion(id: string) {
    try {
        await prisma.examVersion.delete({
            where: { id }
        });
        revalidatePath("/dashboard/exams");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting exam version:", error);
        return { error: "No se pudo eliminar la plantilla. Puede que ya esté vinculada a evaluaciones o resultados de alumnos." };
    }
}

export async function generateExamWithAIPrompt(prompt: string, availableTopics: string[]) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return { error: "No se ha configurado la clave de API de Gemini." };
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const systemInstruction = `
Eres un asistente experto en creación de evaluaciones. Tu objetivo es procesar las peticiones del profesor
y devolver un estricto JSON que defina los parámetros para crear un examen. No devuelvas markdown, solo el JSON raw.
El profesor te pedirá un examen y tú extraerás o deducirás:
1. title: Un título adecuado para el examen
2. questionCount: Número de preguntas solicitadas (por defecto 10 si no especifica)
3. difficultyLevel: Dificultad general solicitada (0 a 5, donde 0 es variado, 1 muy facil, 5 muy dificil)
4. topics: Una lista de las palabras clave o subtemas que mejor coincidan con lo que pide, basándote en la siguiente lista de subtemas disponibles en la base de datos:
[${availableTopics.join(', ')}]
Selecciona al menos 1 tema pertinente de los disponibles si es posible.

Estructura de salida requerida:
{
  "title": "string",
  "questionCount": number,
  "difficultyLevel": number,
  "topics": ["string"]
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });

        const textResponse = response.text;
        if (!textResponse) throw new Error("Respuesta vacía de Gemini");

        let aiSchema;
        try {
            aiSchema = JSON.parse(textResponse);
        } catch (e) {
            // Intento de limpiar el json si tiene backticks
            const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            aiSchema = JSON.parse(cleaned);
        }

        // Ya con el esquema, construimos un FormData falso para usar nuestra función base
        const formData = new FormData();
        formData.append("title", aiSchema.title || "Examen por IA");
        formData.append("questionCount", (aiSchema.questionCount || 10).toString());
        formData.append("difficultyLevel", (aiSchema.difficultyLevel || 0).toString());

        if (aiSchema.topics && Array.isArray(aiSchema.topics)) {
            aiSchema.topics.forEach((t: string) => formData.append("topics", t));
        }

        // Llamamos a generateExamVersion reusando la lógica para seleccionar preguntas y guardar en DB
        const res = await generateExamVersion(formData);

        if (res.error) {
            return { error: `La IA entendió el prompt pero hubo un error generando: ${res.error}` };
        }

        return { success: true };

    } catch (error: any) {
        console.error("AI Generation Error: ", error);
        return { error: "Error de IA: " + error.message };
    }
}
