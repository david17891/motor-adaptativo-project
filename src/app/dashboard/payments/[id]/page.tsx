import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import GroupPaymentsContainer from "./GroupPaymentsContainer";

export default async function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: groupId } = await params;

    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: {
                include: {
                    student: true
                }
            },
            payments: true
        }
    });

    if (!group) {
        redirect("/dashboard/payments");
    }

    // Calcular semana actual
    const now = new Date();
    // Use Math.max to prevent negative diffs from giving an early fake currentWeek. 
    // Actually, startDate could be in the future.
    const diffTime = now.getTime() - group.startDate.getTime();
    const diffDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
    let currentWeek = diffDays > 0 ? Math.ceil(diffDays / 7) : 1;
    if (currentWeek > group.durationWeeks) currentWeek = group.durationWeeks;

    // Formatear estudiantes para el componente
    const studentsData = group.members.map((m: any) => m.student);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/payments" className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <ArrowLeft size={18} className="text-zinc-600 dark:text-zinc-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        Pagos: {group.name}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Control de cuotas y bloqueos por semana.</p>
                </div>
            </div>

            <GroupPaymentsContainer
                groupId={group.id}
                durationWeeks={group.durationWeeks}
                startDate={group.startDate}
                students={studentsData}
                payments={group.payments}
                currentWeek={currentWeek}
            />
        </div>
    );
}
