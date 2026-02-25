"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
