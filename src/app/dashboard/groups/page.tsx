import prisma from "@/lib/prisma";
import { createGroup, deleteGroup } from "./actions";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function GroupsPage() {
    const user = await currentUser();

    // Obtenemos los grupos de este profesor en específico
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
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Mis Grupos</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Crea y gestiona tus grupos de alumnos (Ej. Grupo A, Grupo B).</p>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-6 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    Añadir Nuevo Grupo
                </h2>
                <form action={async (formData: FormData) => {
                    "use server";
                    await createGroup(formData);
                }} className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-end">
                    <div className="sm:col-span-5 space-y-2">
                        <label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Nombre del Grupo</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            placeholder="Ej. Grupo de Álgebra Avanzada"
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                        />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                        <label htmlFor="durationWeeks" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Semanas</label>
                        <input
                            type="number"
                            id="durationWeeks"
                            name="durationWeeks"
                            min="1"
                            max="52"
                            defaultValue="4"
                            required
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center font-bold transition-all"
                        />
                    </div>
                    <div className="sm:col-span-3 space-y-2">
                        <label htmlFor="startDate" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Inicio de Clases</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            required
                            defaultValue={new Date().toISOString().split("T")[0]}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <button
                            type="submit"
                            className="w-full h-[46px] px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center"
                        >
                            Añadir
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500">
                        No tienes grupos registrados aún. Crea tu primer grupo arriba.
                    </div>
                ) : (
                    groups.map((group: any) => (
                        <div key={group.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{group.name}</h3>
                                    <p className="text-sm text-zinc-500 font-medium">{group._count.members} alumnos</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-1 rounded tracking-wider uppercase">
                                        {group.durationWeeks} Semanas
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-900">
                                <Link href={`/dashboard/groups/${group.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                    Ver Detalles & Alumnos &rarr;
                                </Link>
                                <form action={async () => {
                                    "use server";
                                    await deleteGroup(group.id);
                                }}>
                                    <button type="submit" className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors">
                                        Eliminar
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
}
