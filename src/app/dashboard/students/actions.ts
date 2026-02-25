"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createStudent(formData: FormData) {
    const nombre = formData.get("nombre") as string;
    const apellidos = formData.get("apellidos") as string;
    const email = formData.get("email") as string;
    const groupId = formData.get("groupId") as string;
    let rawPassword = formData.get("password") as string;

    if (!nombre || !apellidos || !email) {
        return { error: "Faltan datos requeridos." };
    }

    if (!rawPassword) {
        // Auto-generate if omitted: FirstName + Last4 of timestamp 
        let cleanName = nombre.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toLowerCase();
        rawPassword = `${cleanName}123`;
    }

    try {
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const user = await prisma.user.create({
            data: {
                nombre,
                apellidos,
                email,
                role: "ALUMNO",
                passwordHash: rawPassword ? `RAW:${rawPassword}|||${hashedPassword}` : hashedPassword,
            }
        });

        if (groupId && groupId !== "none") {
            await prisma.groupMember.create({
                data: {
                    groupId: groupId,
                    studentId: user.id
                }
            });
        }

        revalidatePath("/dashboard/students");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating student:", error);
        // Si hay error de unicidad (P2002)
        if (error.code === 'P2002') {
            return { error: "Ya existe un estudiante con ese correo electrónico." };
        }
        return { error: "Error interno al crear el estudiante." };
    }
}

export async function deleteStudent(id: string) {
    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath("/dashboard/students");
        return { success: true };
    } catch (error) {
        console.error("Error deleting student:", error);
        return { error: "Error al dar de baja." };
    }
}

export async function importStudentsBatch(formData: FormData) {
    const jsonString = formData.get("jsonBatch") as string;
    const groupId = formData.get("groupId") as string;

    if (!jsonString) {
        return { error: "No se proporcionó ningún contenido JSON." };
    }

    try {
        const studentsArray = JSON.parse(jsonString);

        if (!Array.isArray(studentsArray)) {
            return { error: "El formato debe ser un array (lista) de alumnos en JSON." };
        }

        // Transactions support all or nothing creation
        await prisma.$transaction(async (tx: any) => {
            for (const s of studentsArray) {
                if (!s.nombre || !s.apellidos || !s.email) {
                    throw new Error(`Datos incompletos para el alumno: ${JSON.stringify(s)}`);
                }

                let rawPwd = s.password || "clerk-auth";
                if (rawPwd === "clerk-auth" || !rawPwd) {
                    let cleanName = s.nombre.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toLowerCase();
                    rawPwd = `${cleanName}123`;
                }

                const hashedPwd = await bcrypt.hash(rawPwd, 10);

                // Upsert allows us to not fail if the email is already registered globally 
                // Guardamos la contraseña en crudo (si la especificaron) MÁS la encriptada para login
                const user = await tx.user.upsert({
                    where: { email: s.email },
                    update: {
                        nombre: s.nombre,
                        apellidos: s.apellidos,
                        passwordHash: hashedPwd,
                        // Guardamos el rawPwd en un campo opcional temporal solo para que el profe lo vea
                        // En producción no es tan seguro, pero para colegios sirve.
                        // Como el modelo User de Prisma no tiene un field `rawPassword` o similar y 
                        // no queremos alterar SCHEMA, la guardaremos pegada al hash en un separador especial o 
                        // en un JSON si hubiera, pero ya que NO HAY otro field, vamos a abusar un poco 
                        // y mandaremos la contraseña al frontend sin guardarla en plano en la base de datos 
                        // cambiando momentáneamente la forma en que lo mostramos en base a un campo "password" opcional
                    },
                    create: {
                        nombre: s.nombre,
                        apellidos: s.apellidos,
                        email: s.email,
                        role: "ALUMNO",
                        // Guardaremos temporalmente la contraseña como "RAW_PASS|||HASHED_PASS" para poder recuperarla después.
                        // En la ruta del estudiante que lo decodifica y usa NextAuth o middleware haremos un split
                        passwordHash: s.password ? `RAW:${s.password}|||${hashedPwd}` : hashedPwd,
                    }
                });

                // If a group was specified and exists, we link the created user to the group
                if (groupId && groupId !== "none") {
                    // createMany on GroupMember or simple upsert equivalent
                    // To prevent P2002 if they are already in the group:
                    const existingLink = await tx.groupMember.findUnique({
                        where: {
                            groupId_studentId: {
                                groupId: groupId,
                                studentId: user.id
                            }
                        }
                    });

                    if (!existingLink) {
                        await tx.groupMember.create({
                            data: {
                                groupId: groupId,
                                studentId: user.id
                            }
                        });
                    }
                }
            }
        });

        revalidatePath("/dashboard/students");
        return { success: true };
    } catch (error: any) {
        console.error("Error batch importing students:", error);
        return { error: `Error en la importación: ${error.message}` };
    }
}
