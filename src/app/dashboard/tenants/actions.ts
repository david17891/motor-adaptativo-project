"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTenant(formData: FormData) {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!name || !slug) {
        return { error: "El nombre y el slug son requeridos." };
    }

    try {
        await prisma.tenant.create({
            data: { name, slug },
        });
        revalidatePath("/dashboard/tenants");
        return { success: true };
    } catch (error) {
        console.error("Error creating tenant:", error);
        return { error: "Error al crear la escuela. Es posible que el identificador (slug) ya exista." };
    }
}

export async function deleteTenant(id: string) {
    try {
        await prisma.tenant.delete({ where: { id } });
        revalidatePath("/dashboard/tenants");
        return { success: true };
    } catch (error) {
        console.error("Error deleting tenant:", error);
        return { error: "Error al eliminar la escuela." };
    }
}
