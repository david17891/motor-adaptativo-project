import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, CheckCircle2, AlertCircle, Clock, Trophy } from "lucide-react";
import { formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";

export default async function TeacherEvaluationReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: evaluationId } = await params;

    const evaluation = await prisma.evaluation.findUnique({
        where: { id: evaluationId },
        include: {
            group: {
                include: {
                    members: {
                        include: {
                            student: true
                        },
                        orderBy: {
                            student: { apellidos: 'asc' }
                        }
                    }
                }
            },
            examVersion: {
                include: {
                    questions: {
                        include: { question: true },
                        orderBy: { orderIndex: 'asc' }
                    }
                }
            },
            results: {
                include: { answers: true }
            }
        }
    });

    if (!evaluation) {
        notFound();
    }

    const members = evaluation.group.members;
    const results = evaluation.results;

    const totalStudents = members.length;
    const completedResults = results.filter((r: any) => r.completedAt !== null);
    const completedCount = completedResults.length;
    const pendingCount = totalStudents - completedCount;

    const averageScore = completedCount > 0
        ? completedResults.reduce((acc: number, r: any) => acc + (r.score || 0), 0) / completedCount
        : 0;

    const now = new Date();
    const isActive = now >= evaluation.startDate && now <= evaluation.endDate;
    const isExpired = now > evaluation.endDate;

    const statusBadge = isActive
        ? <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} /> ACTIVA</span>
        : isExpired
            ? <span className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={14} /> CERRADA</span>
            : <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={14} /> PROGRAMADA</span>;

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Link href={`/dashboard/groups/${evaluation.groupId}`} className="mt-1 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <ArrowLeft size={18} className="text-zinc-600 dark:text-zinc-400" />
                </Link>
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Reporte de Evaluación
                        </h1>
                        {statusBadge}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <p><strong className="text-zinc-700 dark:text-zinc-300">Examen: </strong> {evaluation.examVersion.title}</p>
                        <p><strong className="text-zinc-700 dark:text-zinc-300">Grupo: </strong> {evaluation.group.name}</p>
                        <p>
                            Vigencia: {evaluation.startDate.toLocaleDateString()} a {evaluation.endDate.toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tarjetas de Estadísticas Globales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Promedio</span>
                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{Math.round(averageScore)}%</span>
                </div>
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Entregas</span>
                    <span className="text-3xl font-black text-green-600 dark:text-green-500">{completedCount}</span>
                </div>
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Pendientes</span>
                    <span className="text-3xl font-black text-orange-600 dark:text-orange-400">{pendingCount}</span>
                </div>
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Total Alumnos</span>
                    <span className="text-3xl font-black text-zinc-700 dark:text-zinc-300">{totalStudents}</span>
                </div>
            </div>

            {/* Tabla de Alumnos */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                    <h2 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Users size={18} className="text-indigo-500" /> Detalle por Estudiante
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-3">Alumno</th>
                                <th className="px-6 py-3">Estatus</th>
                                <th className="px-6 py-3 text-center">Calificación</th>
                                <th className="px-6 py-3 text-right">Tiempo Tomado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member: any) => {
                                const result = results.find((r: any) => r.studentId === member.student.id);
                                const hasStarted = !!result;
                                const isCompleted = !!result?.completedAt;

                                let durationText = "-";
                                if (isCompleted && result?.startedAt && result?.completedAt) {
                                    durationText = formatDistanceStrict(result.completedAt, result.startedAt, { locale: es });
                                }

                                return (
                                    <tr key={member.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                <span>{member.student.apellidos}, {member.student.nombre}</span>
                                                {isCompleted && (result.score || 0) < 60 && (
                                                    <span title="Alumno en Riesgo"><AlertCircle size={14} className="text-red-500" /></span>
                                                )}
                                            </div>
                                            <div className="text-xs text-zinc-500">{member.student.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isCompleted ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-xs font-semibold">
                                                    Entregado
                                                </span>
                                            ) : hasStarted ? (
                                                <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded text-xs font-semibold">
                                                    En Progreso
                                                </span>
                                            ) : isExpired ? (
                                                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-xs font-semibold">
                                                    No Presentó
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs font-semibold">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {isCompleted ? (
                                                <span className={`font-bold pb-0.5 border-b-2 ${(result.score || 0) >= 60
                                                    ? "text-green-600 border-green-200 dark:text-green-400 dark:border-green-900/40"
                                                    : "text-red-600 border-red-200 dark:text-red-400 dark:border-red-900/40"
                                                    }`}>
                                                    {Math.round(result.score || 0)}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                                            {durationText}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Análisis de Reactivos (Item Analysis) */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm mt-8">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                    <h2 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Trophy size={18} className="text-yellow-500" /> Análisis de Reactivos (Item Analysis)
                    </h2>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {evaluation.examVersion.questions.map((eq: any, index: number) => {
                            const qId = eq.questionId;

                            // Buscar todas las respuestas a esta pregunta en resultados COMPLETADOS
                            const answersForQ = completedResults.map((r: any) => {
                                const ans = r.answers.find((a: any) => a.questionId === qId);
                                if (ans) {
                                    const member = members.find((m: any) => m.student.id === r.studentId);
                                    return {
                                        ...ans,
                                        studentName: member ? `${member.student.apellidos} ${member.student.nombre}` : "Alumno Desconocido"
                                    };
                                }
                                return null;
                            }).filter(Boolean);

                            const totalA = answersForQ.length;
                            const correctAnswers = answersForQ.filter((a: any) => a.isCorrect);
                            const incorrectAnswers = answersForQ.filter((a: any) => !a.isCorrect);
                            const correctA = correctAnswers.length;
                            const incorrectA = incorrectAnswers.length;
                            const pct = totalA > 0 ? Math.round((correctA / totalA) * 100) : 0;

                            const contentText = typeof eq.question.content === 'object' && eq.question.content !== null ? (eq.question.content.text || "Pregunta...") : "Pregunta...";
                            const shortText = contentText.length > 80 ? contentText.substring(0, 80) + '...' : contentText;

                            return (
                                <details key={eq.id} className="group bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                    <summary className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                                        <div className="w-12 h-12 shrink-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-400 shadow-sm">
                                            Q{index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                    {eq.question.area}
                                                </span>
                                                {eq.question.subarea && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                                        {eq.question.subarea}
                                                    </span>
                                                )}
                                                <span className="text-[10px] bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded-full ml-auto sm:ml-2 group-open:hidden uppercase font-semibold">
                                                    Ver Detalle
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate" title={contentText}>
                                                {shortText}
                                            </p>
                                        </div>
                                        <div className="w-full sm:w-64 shrink-0 flex items-center gap-3">
                                            <div className="flex flex-col items-end flex-1">
                                                <div className="flex items-center gap-2 w-full">
                                                    <div className="flex-1 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-sm font-bold w-10 text-right ${pct >= 70 ? 'text-green-600 dark:text-green-400' : pct >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 uppercase font-semibold tracking-wider">Acierto del Grupo</span>
                                            </div>
                                        </div>
                                    </summary>

                                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 grid grid-cols-1 md:grid-cols-2 gap-6 scale-y-100 origin-top transition-transform duration-200">
                                        <div>
                                            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                                                <span className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">{incorrectA}</span>
                                                Alumnos que fallaron
                                            </h4>
                                            {incorrectA === 0 ? (
                                                <p className="text-sm text-zinc-500 italic">Nadie falló este reactivo.</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {incorrectAnswers.map((ans: any, i: number) => (
                                                        <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                            {ans.studentName}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                                                <span className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">{correctA}</span>
                                                Alumnos que acertaron
                                            </h4>
                                            {correctA === 0 ? (
                                                <p className="text-sm text-zinc-500 italic">Nadie acertó este reactivo.</p>
                                            ) : (
                                                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                    {correctAnswers.map((ans: any, i: number) => (
                                                        <li key={i} className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                            {ans.studentName}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </details>
                            );
                        })}
                        {evaluation.examVersion.questions.length === 0 && (
                            <p className="text-sm text-zinc-500 text-center">No hay reactivos en esta evaluación.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
