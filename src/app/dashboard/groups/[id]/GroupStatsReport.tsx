"use client";

import React from 'react';
import { usePDF } from 'react-to-pdf';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip,
    PieChart, Pie, Cell, Legend as PieLegend, Tooltip as PieTooltip
} from 'recharts';
import { DownloadCloud, TrendingUp, Target, BarChart3 } from 'lucide-react';

interface GroupStatsReportProps {
    groupName: string;
    levelData: { name: string, value: number, fill: string }[];
    domainData: { subject: string, A: number, fullMark: number }[];
    historyData: { date: string, Promedio: number }[];
    hasInteractionData: boolean;
}

export default function GroupStatsReport({ groupName, levelData, domainData, historyData, hasInteractionData }: GroupStatsReportProps) {
    const { toPDF, targetRef } = usePDF({ filename: `Reporte_${groupName.replace(/\s+/g, '_')}.pdf` });

    if (!hasInteractionData) {
        return null;
    }

    return (
        <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                        <BarChart3 className="text-blue-600" /> Analítica Interactiva y Reportes
                    </h2>
                    <p className="text-sm text-zinc-500">
                        Visualiza el rendimiento profundo de tus alumnos y descarga el reporte en formato PDF para tus evidencias.
                    </p>
                </div>
                <button
                    onClick={() => toPDF()}
                    className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm whitespace-nowrap"
                >
                    <DownloadCloud size={18} />
                    Descargar PDF
                </button>
            </div>

            {/* Container to be captured by PDF generator */}
            <div
                ref={targetRef}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm print-container"
                style={{ backgroundColor: 'white' }} // Ensures PDF doesn't capture transparent background
            >
                {/* PDF Header (Only useful in the generated PDF if we want it to look like a document) */}
                <div className="mb-8 border-b border-zinc-200 pb-4">
                    <h1 className="text-2xl font-black text-zinc-900">Reporte Estadístico Oficial</h1>
                    <p className="text-zinc-500 font-medium">Grupo: {groupName}</p>
                    <p className="text-zinc-400 text-xs mt-1">Generado automáticamente por el Motor Adaptativo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* RADAR CHART */}
                    <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                        <h3 className="font-bold text-zinc-800 mb-1 flex items-center gap-2">
                            <Target size={16} className="text-indigo-500" /> Telaraña de Dominio (Áreas)
                        </h3>
                        <p className="text-xs text-zinc-500 mb-4">Porcentaje de aciertos históricos del grupo en varios campos.</p>
                        <div className="h-64">
                            {domainData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={domainData}>
                                        <PolarGrid stroke="#e4e4e7" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#52525b', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                        <Radar name="Promedio Grupo" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Insuficientes métricas de área</div>
                            )}
                        </div>
                    </div>

                    {/* PIE CHART */}
                    <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                        <h3 className="font-bold text-zinc-800 mb-1">Distribución de Niveles</h3>
                        <p className="text-xs text-zinc-500 mb-4">Cantidad de alumnos ubicados en cada nivel del motor adaptativo.</p>
                        <div className="h-64">
                            {levelData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={levelData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {levelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <PieTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <PieLegend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Sin alumnos ubicados aún</div>
                            )}
                        </div>
                    </div>

                    {/* LINE CHART */}
                    <div className="md:col-span-2 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                        <h3 className="font-bold text-zinc-800 mb-1 flex items-center gap-2">
                            <TrendingUp size={16} className="text-green-500" /> Histórico de Rendimiento
                        </h3>
                        <p className="text-xs text-zinc-500 mb-4">Evolución del porcentaje de respuestas correctas a lo largo del tiempo.</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                                    <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                                    <LineTooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${value}%`, 'Promedio']}
                                        labelStyle={{ color: '#52525b', fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Line type="monotone" dataKey="Promedio" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
