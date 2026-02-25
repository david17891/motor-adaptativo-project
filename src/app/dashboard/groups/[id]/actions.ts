"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function removeStudentFromGroup(groupId: string, studentId: string) {
    try {
        await prisma.groupMember.delete({
            where: {
                groupId_studentId: {
                    groupId,
                    studentId
                }
            }
        });
        revalidatePath(`/dashboard/groups/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error("Error removing student:", error);
        return { error: "No se pudo remover al alumno del grupo." };
    }
}

export async function addEvaluationToGroup(formData: FormData) {
    const groupId = formData.get("groupId") as string;
    const examVersionId = formData.get("examVersionId") as string;
    const startDateForm = formData.get("startDate") as string;
    const endDateForm = formData.get("endDate") as string;

    if (!groupId || !examVersionId || !startDateForm || !endDateForm) {
        return { error: "Faltan datos requeridos." };
    }

    try {
        await prisma.evaluation.create({
            data: {
                groupId,
                examVersionId,
                startDate: new Date(startDateForm),
                endDate: new Date(endDateForm),
                status: "PUBLISHED"
            }
        });

        revalidatePath(`/dashboard/groups/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error("Error assigning evaluation:", error);
        return { error: "Error interno al asignar el examen al grupo." };
    }
}

export async function addStudentToGroupQuickly(formData: FormData) {
    const groupId = formData.get("groupId") as string;
    const email = formData.get("email") as string;

    if (!groupId || !email) return { error: "Datos faltantes" };

    const student = await prisma.user.findUnique({
        where: { email }
    });

    if (!student || student.role !== "ALUMNO") {
        return { error: "Estudiante no encontrado con ese correo." };
    }

    try {
        await prisma.groupMember.upsert({
            where: {
                groupId_studentId: { groupId, studentId: student.id }
            },
            update: {},
            create: {
                groupId,
                studentId: student.id
            }
        });

        revalidatePath(`/dashboard/groups/${groupId}`);
        return { success: true };
    } catch (e) {
        return { error: "Error al añadir estudiante" };
    }
}

export async function addAdaptiveEvaluationToGroup(formData: FormData) {
    const groupId = formData.get("groupId") as string;
    const title = formData.get("title") as string;
    const targetArea = formData.get("targetArea") as string;
    const targetSubareas = formData.getAll("targetSubarea") as string[];
    const targetSubareaStr = targetSubareas.length > 0 ? targetSubareas.join(',') : null;
    const totalQuestions = parseInt(formData.get("totalQuestions") as string) || 10;
    const startDateForm = formData.get("startDate") as string;
    const endDateForm = formData.get("endDate") as string;

    if (!groupId || !title || !targetArea || !startDateForm || !endDateForm) {
        throw new Error("Faltan datos requeridos.");
    }

    try {
        await prisma.adaptiveEvaluation.create({
            data: {
                groupId,
                title,
                targetArea,
                targetSubarea: targetSubareaStr,
                totalQuestions,
                startDate: new Date(startDateForm),
                endDate: new Date(endDateForm),
                status: "PUBLISHED"
            }
        });
    } catch (error) {
        console.error("Error creating adaptive evaluation:", error);
        throw new Error("Error interno al programar la evaluación adaptativa.");
    }

    redirect(`/dashboard/groups/${groupId}`);
}
