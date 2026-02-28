import prisma from "@/lib/prisma";
import { createTenant, deleteTenant } from "./actions";

export default async function TenantsPage() {
    const tenants = await prisma.tenant.findMany({
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Escuelas (Tenants)</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Gestiona las instituciones y sedes registradas en la plataforma.</p>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Añadir Nueva Escuela</h2>
                <form action={createTenant as any} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full">
                        <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre de la Escuela</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            placeholder="Ej. UABC Valle de las Palmas"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                        <label htmlFor="slug" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Identificador Único (Slug)</label>
                        <input
                            type="text"
                            id="slug"
                            name="slug"
                            required
                            placeholder="Ej. uabc-vdp"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 font-medium h-[42px] transition-colors"
                    >
                        Registrar
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Slug</th>
                                <th className="px-6 py-4 font-medium">Fecha de Registro</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        No hay escuelas registradas aún. Añade la primera arriba.
                                    </td>
                                </tr>
                            ) : (
                                tenants.map(tenant => (
                                    <tr key={tenant.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{tenant.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs font-mono text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                                {tenant.slug}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{tenant.createdAt.toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <form action={async () => {
                                                "use server";
                                                await deleteTenant(tenant.id);
                                            }}>
                                                <button type="submit" className="text-red-500 hover:text-red-600 font-medium text-sm transition-colors">
                                                    Eliminar
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
