import prisma from "@/lib/prisma";
import Link from "next/link";
import { removeStudentFromGroup, addStudentToGroupQuickly, deleteAdaptiveEvaluation, deleteStandardEvaluation } from "./actions";
import AssignEvaluationForm from "./AssignEvaluationForm";
import { ArrowLeft, BookOpen, AlertCircle, UserPlus, Target, ChevronRight, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";
import GroupHeatmap from "./GroupHeatmap";
import GroupStatsContainer from "./GroupStatsContainer";

export default async function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: groupId } = await params;

    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: {
                include: {
                    student: true
                }
            },
            evaluations: {
                include: {
                    examVersion: true,
                    _count: {
                        select: { results: true }
                    }
                }
            },
            adaptiveEvaluations: {
                include: {
                    dynamicSessions: true
                },
                orderBy: { startDate: 'desc' }
            }
        }
    });

    if (!group) {
        redirect("/dashboard/groups");
    }

    const availableExams = await prisma.examVersion.findMany({
        where: { isActive: true },
        include: {
            _count: {
                select: { questions: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // Fechas default para formularios 
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekFormatted = nextWeek.toISOString().split("T")[0];

    // Calcular semana actual
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - group.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let currentWeek = Math.ceil(diffDays / 7);
    if (currentWeek < 1) currentWeek = 1;
    if (currentWeek > group.durationWeeks) currentWeek = group.durationWeeks;

    // Formatear estudiantes para el componente
    const studentsData = group.members.map(m => m.student);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/groups" className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <ArrowLeft size={18} className="text-zinc-600 dark:text-zinc-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        {group.name}
                        <span className="text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400">
                            ID: {group.id.slice(0, 8)}...
                        </span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Panel de control de alumnos del grupo y evaluaciones activas.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        Alumnos Registrados en este Grupo ({group.members.length})
                    </h2>

                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">

                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                            <form action={async (formData) => {
                                "use server";
                                await addStudentToGroupQuickly(formData);
                            }} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input type="hidden" name="groupId" value={group.id} />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="Añadir por correo (ej. alumno@mail.com)"
                                    className="flex-1 px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-zinc-900"
                                />
                                <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors">
                                    <UserPlus size={16} /> Añadir
                                </button>
                            </form>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[500px] sm:min-w-0">
                                <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3">Alumno</th>
                                        <th className="px-6 py-3 hidden sm:table-cell">Correo</th>
                                        <th className="px-4 sm:px-6 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.members.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                                                Vacio. Usa el menú principal de "Alumnos" para matricular estudiantes a este grupo masivamente.
                                            </td>
                                        </tr>
                                    ) : (
                                        group.members.map((member: any) => (
                                            <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                                                <td className="px-4 sm:px-6 py-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={`/dashboard/students/${member.student.id}`}
                                                                className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors block truncate max-w-[150px] sm:max-w-none"
                                                            >
                                                                {member.student.nombre} {member.student.apellidos}
                                                            </Link>
                                                            <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[150px] sm:max-w-none sm:hidden">{member.student.email}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                                                            <div className="text-right">
                                                                <div className="text-[10px] sm:text-sm font-bold text-zinc-700 dark:text-zinc-300">Niv. {member.student.level}</div>
                                                                <div className="hidden xs:block text-[10px] text-amber-600 dark:text-amber-500 font-medium whitespace-nowrap">🔥 {member.student.currentStreak || 0}</div>
                                                            </div>
                                                            <Link href={`/dashboard/students/${member.student.id}`} className="p-1 sm:p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                                                                <ChevronRight size={16} />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-500 hidden sm:table-cell">{member.student.email}</td>
                                                <td className="px-4 sm:px-6 py-4 text-right">
                                                    <form action={async () => {
                                                        "use server";
                                                        await removeStudentFromGroup(group.id, member.student.id);
                                                    }}>
                                                        <button type="submit" className="text-red-500 hover:text-red-700 text-[10px] sm:text-xs font-semibold uppercase whitespace-nowrap">Remover</button>
                                                    </form>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Evaluaciones Adaptativas (Nuevas) */}
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm mt-8">
                        <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 gap-4">
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                Evaluaciones Adaptativas <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Nuevo Motor</span>
                            </h2>
                            <Link href={`/dashboard/groups/${groupId}/new-adaptive`} className="text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                                + Crear Adaptativa
                            </Link>
                        </div>
                        <div className="p-0">
                            {group.adaptiveEvaluations.length === 0 ? (
                                <div className="text-center p-8 text-zinc-500 text-sm">
                                    <p>No hay evaluaciones adaptativas asignadas a este grupo.</p>
                                    <p className="mt-1">Crea una para que el sistema ajuste la dificultad dinámicamente según el alumno.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {group.adaptiveEvaluations.map((evalRecord: any) => {
                                        const now = new Date();
                                        const isActive = now >= evalRecord.startDate && now <= evalRecord.endDate;
                                        const isExpired = now > evalRecord.endDate;
                                        const isupcoming = now < evalRecord.startDate;

                                        return (
                                            <li key={evalRecord.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{evalRecord.title}</h3>
                                                        {isActive && <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Activa</span>}
                                                        {isExpired && <span className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Cerrada</span>}
                                                        {isupcoming && <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Programada</span>}
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mb-2">
                                                        Objetivo: <b>{evalRecord.targetArea}</b> {evalRecord.targetSubarea && `> ${evalRecord.targetSubarea}`} ({evalRecord.totalQuestions} reactivos din.)
                                                    </p>
                                                    <p className="text-xs text-zinc-500">
                                                        Vigencia: {evalRecord.startDate.toLocaleDateString()} a {evalRecord.endDate.toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                                    <div className="text-right flex flex-col items-end flex-1 sm:flex-none">
                                                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Sesiones</span>
                                                        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{evalRecord.dynamicSessions.length} / {group.members.length}</span>
                                                    </div>
                                                    <Link href={`/dashboard/adaptive-evaluations/${evalRecord.id}`} className="text-sm border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                                                        Reporte
                                                    </Link>
                                                    <form action={async () => {
                                                        "use server";
                                                        await deleteAdaptiveEvaluation(evalRecord.id, group.id);
                                                    }}>
                                                        <button
                                                            type="submit"
                                                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                                            title="Eliminar evaluación adaptativa"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </form>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Mapa de Calor y Exámenes */}
                <div className="space-y-6">
                    {/* Diagnóstico Grupal */}
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                        <GroupHeatmap groupId={group.id} />
                    </div>

                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        Evaluaciones
                    </h2>

                    <AssignEvaluationForm
                        groupId={group.id}
                        availableExams={availableExams}
                        today={today}
                        nextWeekFormatted={nextWeekFormatted}
                    />

                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
                        {group.evaluations.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500 text-sm">
                                Ningún examen activo para este grupo.
                            </div>
                        ) : (
                            group.evaluations.map((ev: any) => (
                                <div key={ev.id} className="p-4 border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{ev.examVersion.title}</h4>
                                    <div className="mt-1 mb-3 flex justify-between items-center text-xs">
                                        <span className="text-zinc-500">Cierre: {ev.endDate.toLocaleDateString()}</span>
                                        <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                                            {ev._count.results} Entregas
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Link href={`/dashboard/evaluations/${ev.id}`} className="flex-1 block text-center py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md text-xs font-bold transition-colors">
                                            Ver Reporte Completo
                                        </Link>
                                        <form action={async () => {
                                            "use server";
                                            await deleteStandardEvaluation(ev.id, group.id);
                                        }}>
                                            <button
                                                type="submit"
                                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <GroupStatsContainer groupId={group.id} groupName={group.name} />
        </div>
    );
}
