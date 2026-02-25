"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function loginStudent(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Por favor ingresa tu correo y contraseña." };
    }

    const student = await prisma.user.findUnique({
        where: { email }
    });

    if (!student || student.role !== "ALUMNO") {
        return { error: "Credenciales inválidas. Verifica tu correo y contraseña." };
    }

    let isMatch = false;

    // Extraer del string RAW si aplica
    let realHash = student.passwordHash;
    if (realHash.startsWith('RAW:')) {
        const parts = realHash.split('|||');
        realHash = parts[1] || parts[0];
    }

    if (!realHash.startsWith("$2")) {
        // Fallback for students with legacy plaintext passwords
        if (realHash === password) {
            isMatch = true;
            // Upgrade password in background
            const hashed = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { id: student.id },
                data: { passwordHash: `RAW:${password}|||${hashed}` }
            });
        }
    } else {
        // Normal bcrypt verification
        isMatch = await bcrypt.compare(password, realHash);
    }

    if (!isMatch) {
        return { error: "Credenciales inválidas. Verifica tu correo y contraseña." };
    }

    // Para este MVP, guardamos el ID en una cookie básica
    const c = await cookies();
    c.set("studentToken", student.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 1 semana
    });

    // Redirigir al dashboard sin usar error object
    redirect("/student");
}

export async function logoutStudent() {
    const c = await cookies();
    c.delete("studentToken");
    redirect("/student/login");
}
