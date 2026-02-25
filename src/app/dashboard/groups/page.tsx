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

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Añadir Nuevo Grupo</h2>
                <form action={async (formData: FormData) => {
                    "use server";
                    await createGroup(formData);
                }} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full">
                        <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre del Grupo</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            placeholder="Ej. Grupo A - Matemáticas"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium h-[42px] transition-colors shadow-sm"
                    >
                        Añadir Grupo
                    </button>
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
                                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{group.name}</h3>
                                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2.5 py-1 rounded-full font-medium">
                                    {group._count.members} Alumnos
                                </span>
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
        </div>
    );
}
