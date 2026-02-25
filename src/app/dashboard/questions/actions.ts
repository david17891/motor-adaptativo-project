"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createQuestion(formData: FormData) {
    const area = formData.get("area") as string;
    const subarea = formData.get("subarea") as string;
    const contentText = formData.get("content") as string;
    const topicsRaw = formData.get("topics") as string;
    const difficultyLevel = parseInt(formData.get("difficultyLevel") as string);
    const correctOptionIndex = parseInt(formData.get("correctOption") as string);

    if (!area || !contentText || isNaN(correctOptionIndex)) {
        return { error: "Faltan datos requeridos." };
    }

    // Parsear los temas separados por coma
    const topics = topicsRaw
        ? topicsRaw.split(",").map(t => t.trim()).filter(t => t.length > 0)
        : [];

    // Estructuramos el contenido (texto de la pregunta + temas)
    const content = {
        text: contentText,
        topics: topics
    };

    // Construir el array de opciones (4 incisos fijos: 0, 1, 2, 3)
    const options = [0, 1, 2, 3].map((index) => {
        const optionText = formData.get(`option_${index}`) as string;
        return {
            id: crypto.randomUUID(), // Generar un ID único para la opción
            text: optionText,
            is_correct: index === correctOptionIndex,
        };
    });

    // Validar que todas las opciones tengan texto
    if (options.some((opt) => !opt.text.trim())) {
        return { error: "Todos los incisos deben tener una respuesta." };
    }

    try {
        await prisma.question.create({
            data: {
                area,
                subarea: subarea || null,
                content,
                options,
                difficultyLevel,
            },
        });

        revalidatePath("/dashboard/questions");
        return { success: true };
    } catch (error) {
        console.error("Error creating question:", error);
        return { error: "Error al guardar la pregunta." };
    }
}

export async function deleteQuestion(id: string) {
    try {
        await prisma.question.delete({ where: { id } });
        revalidatePath("/dashboard/questions");
        return { success: true };
    } catch (error) {
        console.error("Error deleting question:", error);
        return { error: "Error al eliminar." };
    }
}

export async function deleteAllQuestions() {
    try {
        await prisma.question.deleteMany({});
        revalidatePath("/dashboard/questions");
        return { success: true };
    } catch (error) {
        console.error("Error deleting all questions:", error);
        return { error: "Error al vaciar el banco de preguntas." };
    }
}

export async function importQuestionsBatch(formData: FormData) {
    const jsonString = formData.get("jsonBatch") as string;

    if (!jsonString) {
        return { error: "No se proporcionó ningún contenido JSON." };
    }

    try {
        const questionsArray = JSON.parse(jsonString);

        if (!Array.isArray(questionsArray)) {
            return { error: "El formato debe ser un array (lista) de preguntas en JSON." };
        }

        let importedCount = 0;

        // Iterar sobre las preguntas e insertarlas
        for (const q of questionsArray) {
            // Validaciones básicas
            if (!q.area || !q.content || !Array.isArray(q.options) || q.options.length !== 4) {
                console.warn("Pregunta ignorada por formato inválido:", q);
                continue; // Saltamos esta pregunta si no es válida
            }

            const difficultyLevel = q.difficultyLevel ? parseInt(q.difficultyLevel.toString()) : 1;
            const topics = Array.isArray(q.topics) ? q.topics : [];
            const content = { text: q.content, topics: topics };

            const options = q.options.map((opt: any) => ({
                id: crypto.randomUUID(),
                text: opt.text || "",
                is_correct: !!opt.is_correct
            }));

            // Validar que exactamente al menos una sea correcta
            if (!options.some((opt: any) => opt.is_correct)) {
                console.warn("Pregunta ignorada por no tener opción correcta:", q);
                continue;
            }

            await prisma.question.create({
                data: {
                    area: q.area,
                    subarea: q.subarea || null,
                    content: content,
                    difficultyLevel: difficultyLevel,
                    options: options
                }
            });

            importedCount++;
        }

        revalidatePath("/dashboard/questions");
        return { success: true, count: importedCount };

    } catch (error) {
        console.error("Error parsing JSON for batch import:", error);
        return { error: "El formato JSON es inválido. Verifica la sintaxis." };
    }
}
