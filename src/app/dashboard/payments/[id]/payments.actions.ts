"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function togglePayment(groupId: string, studentId: string, week: number, action: "PAY" | "REVOKE") {
    try {
        if (action === "PAY") {
            await prisma.payment.create({
                data: {
                    groupId,
                    studentId,
                    week
                }
            });
        } else {
            await prisma.payment.deleteMany({
                where: {
                    groupId,
                    studentId,
                    week
                }
            });
        }

        revalidatePath(`/dashboard/groups/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error("Error toggling payment:", error);
        return { error: "No se pudo actualizar el pago." };
    }
}
