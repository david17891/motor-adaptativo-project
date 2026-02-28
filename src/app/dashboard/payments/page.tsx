import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";

export default async function PaymentsDashboard() {
    const user = await currentUser();

    const groups = await prisma.group.findMany({
        where: { profesorId: user?.id },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { members: true }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <CreditCard className="text-emerald-600" size={32} /> Central de Pagos
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">Supervisa y registra las cuotas semanales de todos tus alumnos.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500">
                        No tienes grupos registrados aún. Crea un grupo primero.
                    </div>
                ) : (
                    groups.map((group: any) => (
                        <Link key={group.id} href={`/dashboard/payments/${group.id}`} className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col hover:border-emerald-500 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{group.name}</h3>
                                    <p className="text-sm text-zinc-500 font-medium">{group._count.members} alumnos inscritos</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-1 rounded tracking-wider uppercase">
                                        {group.durationWeeks} Semanas
                                    </span>
                                </div>
                            </div>
                            <div className="mt-auto pt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-900 text-sm font-bold text-emerald-600 dark:text-emerald-500">
                                Gestionar Pagos
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
