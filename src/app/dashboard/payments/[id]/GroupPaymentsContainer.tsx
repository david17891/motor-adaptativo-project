"use client";

import React, { useState } from 'react';
import { togglePayment } from './payments.actions';
import { Check, X, CreditCard, Loader2 } from 'lucide-react';

interface Student {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
}

interface PaymentRecord {
    studentId: string;
    week: number;
    paidAt: Date;
}

interface GroupPaymentsContainerProps {
    groupId: string;
    durationWeeks: number;
    startDate: Date;
    students: Student[];
    payments: PaymentRecord[];
    currentWeek: number;
}

export default function GroupPaymentsContainer({ groupId, durationWeeks, startDate, students, payments, currentWeek }: GroupPaymentsContainerProps) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    // Convert payments to a fast lookup dictionary
    const paymentMap = new Map<string, boolean>();
    payments.forEach(p => {
        paymentMap.set(`${p.studentId}-${p.week}`, true);
    });

    const handleToggle = async (studentId: string, week: number, currentlyPaid: boolean) => {
        const key = `${studentId}-${week}`;
        setLoadingMap(prev => ({ ...prev, [key]: true }));

        const action = currentlyPaid ? "REVOKE" : "PAY";
        try {
            await togglePayment(groupId, studentId, week, action);
        } catch (error) {
            console.error("Failed to toggle payment", error);
        } finally {
            setLoadingMap(prev => ({ ...prev, [key]: false }));
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm mt-8">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-lg">
                            <CreditCard className="text-emerald-600" /> Control de Pagos Semanales
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">
                            El bloqueo del alumno se calcula en base a la <strong className="text-zinc-900 dark:text-zinc-300">Semana {currentWeek}</strong> (Semana Actual).
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide">
                            Inicio: {new Date(startDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap border-b border-r border-zinc-100 dark:border-zinc-800">
                                Alumno
                            </th>
                            {Array.from({ length: durationWeeks }).map((_, i) => (
                                <th
                                    key={i}
                                    className={`px-4 py-4 text-center border-b border-zinc-100 dark:border-zinc-800 min-w-[80px] ${(i + 1) === currentWeek
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold'
                                            : ''
                                        }`}
                                >
                                    Sem {i + 1}
                                    {(i + 1) === currentWeek && <div className="text-[10px] uppercase mt-1">Actual</div>}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={durationWeeks + 1} className="px-6 py-8 text-center text-zinc-500">
                                    No hay alumnos inscritos en este grupo todavía.
                                </td>
                            </tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                                    <td className="px-6 py-4 border-r border-zinc-100 dark:border-zinc-800">
                                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                            {student.nombre} {student.apellidos}
                                        </div>
                                        <div className="text-xs text-zinc-500 truncate max-w-[200px]">
                                            {student.email}
                                        </div>
                                    </td>

                                    {Array.from({ length: durationWeeks }).map((_, i) => {
                                        const weekStr = i + 1;
                                        const key = `${student.id}-${weekStr}`;
                                        const isPaid = paymentMap.has(key);
                                        const isLoading = !!loadingMap[key];
                                        const isCurrentOrPast = weekStr <= currentWeek;

                                        return (
                                            <td
                                                key={weekStr}
                                                className={`px-2 py-4 text-center ${weekStr === currentWeek ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => handleToggle(student.id, weekStr, isPaid)}
                                                    disabled={isLoading}
                                                    className={`
                                                        w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all shadow-sm
                                                        ${isLoading ? 'bg-zinc-100 text-zinc-400 cursor-wait' :
                                                            isPaid ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
                                                                isCurrentOrPast ? 'bg-white border-2 border-red-200 text-red-300 hover:border-red-400 hover:text-red-500 dark:bg-zinc-900 dark:border-red-900/50' :
                                                                    'bg-white border border-zinc-200 text-zinc-300 hover:border-zinc-400 hover:text-zinc-500 dark:bg-zinc-900 dark:border-zinc-700'
                                                        }
                                                    `}
                                                    title={isPaid ? "Revocar pago" : "Marcar como pagado"}
                                                >
                                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> :
                                                        isPaid ? <Check size={16} strokeWidth={3} /> :
                                                            isCurrentOrPast ? <X size={16} strokeWidth={2} /> :
                                                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
