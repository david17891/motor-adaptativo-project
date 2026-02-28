"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// Helper para sincronizar el usuario de Clerk con nuestra DB y asegurar un Tenant
async function ensureDbUser() {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthenticated");

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) throw new Error("No email found on Clerk user");

    // Buscamos o creamos un Tenant (Escuela) por defecto para el MVP
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: { name: "Escuela Principal", slug: "main-school" },
        });
    }

    // Sincronizamos el usuario en nuestra DB usando el ID de Clerk
    const dbUser = await prisma.user.upsert({
        where: { id: clerkUser.id },
        update: {}, // Si ya existe, no hacemos nada extra por ahora
        create: {
            id: clerkUser.id,
            email,
            nombre: clerkUser.firstName || "Profesor",
            apellidos: clerkUser.lastName || "",
            passwordHash: "", // No es necesario porque Auth lo maneja Clerk
            role: "PROFESOR",
            tenantId: tenant.id,
        },
    });

    return { dbUser, tenant };
}

export async function createGroup(formData: FormData) {
    const name = formData.get("name") as string;
    const durationWeeks = parseInt(formData.get("durationWeeks") as string) || 4;
    const startDateForm = formData.get("startDate") as string;

    if (!name || !startDateForm) return { error: "Faltan datos requeridos." };

    try {
        const { dbUser, tenant } = await ensureDbUser();

        // Convert YYYY-MM-DD to a reliable Date object ending in T00:00:00
        const startDate = new Date(`${startDateForm}T00:00:00`);

        await prisma.group.create({
            data: {
                name,
                durationWeeks,
                startDate,
                profesorId: dbUser.id,
                tenantId: tenant.id,
            },
        });

        revalidatePath("/dashboard/groups");
        return { success: true };
    } catch (error) {
        console.error("Error creating group:", error);
        return { error: "Ocurrió un error al crear el grupo." };
    }
}

export async function deleteGroup(id: string) {
    try {
        await prisma.group.delete({ where: { id } });
        revalidatePath("/dashboard/groups");
        return { success: true };
    } catch (error) {
        console.error("Error deleting group:", error);
        return { error: "Error al eliminar el grupo." };
    }
}
