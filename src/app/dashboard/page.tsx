import { currentUser } from "@clerk/nextjs/server";
import { Link as LucideLink, ChevronRight, GraduationCap } from "lucide-react";
import Link from 'next/link';
import prisma from "@/lib/prisma";

// Mock para simular los Cards de shadcn (ya que no los instalé formalmente aún para ser rápido)
function CustomCard({ title, value, description }: { title: string, value: string, description?: string }) {
    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
            <p className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-50">{value}</p>
            {description && <p className="text-xs text-zinc-400 mt-1">{description}</p>}
        </div>
    );
}

export default async function DashboardPage() {
    const user = await currentUser();

    // Fetch real stats
    const [tenantsCount, examsCount, studentsCount, results] = await Promise.all([
        prisma.tenant.count(),
        prisma.examVersion.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'ALUMNO' } }),
        prisma.result.findMany({ select: { score: true }, where: { score: { not: null } } })
    ]);

    const globalAvg = results.length > 0
        ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length)
        : "N/A";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Bienvenido, {user?.firstName || "Usuario"} 👋
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Resumen de actividad para tu sección del Motor Adaptativo.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <CustomCard title="Escuelas Activas" value={tenantsCount.toString()} description="Tenants registrados" />
                <CustomCard title="Evaluaciones Activas" value={examsCount.toString()} description="Versiones estáticas disponibles" />
                <CustomCard title="Alumnos" value={studentsCount.toString()} description="Total en todos los grupos" />
                <CustomCard title="Puntaje Promedio" value={globalAvg === "N/A" ? "N/A" : `${globalAvg}%`} description="Resultados globales" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Evaluaciones Recientes</h2>
                    <div className="text-sm text-zinc-500 text-center py-8 border-2 border-dashed rounded-lg border-zinc-100 dark:border-zinc-900">
                        No hay evaluaciones activas actualmente.
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Próximos Pasos</h2>
                    <ul className="space-y-4">
                        {[
                            "Cargar banco de preguntas inicial",
                            "Configurar primera versión de examen",
                            "Dar de alta Sedes/Escuelas"
                        ].map((task, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                                <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px]">
                                    {i + 1}
                                </div>
                                {task}
                                <ChevronRight className="ml-auto text-zinc-300" size={14} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <GraduationCap className="text-blue-600 dark:text-blue-400" /> Vista de Alumno
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm max-w-lg">
                        Descubre cómo verán los estudiantes sus evaluaciones programadas. El entorno del estudiante está minimizado para reducir distracciones y focar en lo académico.
                    </p>
                </div>
                <Link href="/student" target="_blank" className="px-6 py-3 bg-blue-600 text-white dark:bg-blue-600 font-bold rounded-xl shadow hover:bg-blue-700 transition whitespace-nowrap">
                    Ir al Portal Estudiantil
                </Link>
            </div>
        </div>
    );
}
