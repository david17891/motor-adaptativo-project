"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

async function getAdminUserId() {
    // const adminToken = (await cookies()).get("adminToken")?.value;
    // if (!adminToken) throw new Error("Acceso denegado (Admin required)");
    // return adminToken;
    return "admin-bypass";
}

export async function createSubjectArea(formData: FormData) {
    await getAdminUserId();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) return { error: "El nombre es obligatorio" };

    try {
        await prisma.subjectArea.create({
            data: { name, description }
        });
        revalidatePath("/dashboard/curriculum");
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') return { error: "Esta área ya existe." };
        return { error: "Error al crear el área." };
    }
}

export async function createSubjectTopic(formData: FormData) {
    await getAdminUserId();
    const areaId = formData.get("areaId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!areaId || !name) return { error: "El área y el nombre son obligatorios" };

    try {
        await prisma.subjectTopic.create({
            data: { areaId, name, description }
        });
        revalidatePath("/dashboard/curriculum");
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') return { error: "Este subtema ya existe en esta área." };
        return { error: "Error al crear el subtema." };
    }
}
