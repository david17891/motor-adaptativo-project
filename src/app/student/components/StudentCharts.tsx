"use client";

import { Activity, Target, Zap, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartProps {
    radarData: { subject: string; A: number; fullMark: number }[];
    barData: { name: string; Exactitud: number; TotalIntento: number }[];
    strengths: { name: string; accuracy: number; area: string }[];
    weaknesses: { name: string; accuracy: number; area: string }[];
}

export default function StudentCharts({ radarData, barData, strengths, weaknesses }: ChartProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Radar Chart: Dominio por Área */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Dominio por Área</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-6">Porcentaje de exactitud general en cada materia.</p>

                    <div className="flex-1 w-full min-h-[300px]">
                        {radarData.length > 2 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                    <Radar name="Estudiante" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-400 text-sm text-center px-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                Responde reactivos de al menos 3 áreas diferentes para generar tu Gráfico de Dominio (Telaraña).
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Bar Chart: Exactitud por Dificultad */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Precisión por Dificultad</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-6">Qué tan bien te va cuando las preguntas suben de nivel.</p>

                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                                <Tooltip
                                    formatter={(value: any, name: any) => [name === 'Exactitud' ? `${value}%` : value, name]}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="Exactitud" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* 3. Fortalezas y Debilidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Fortalezas */}
                <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-zinc-950 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Tus Mayores Fortalezas ✨</h3>
                    </div>
                    <p className="text-sm text-indigo-700/70 dark:text-indigo-300/60 mb-6">Subtemas donde tienes una exactitud sobresaliente.</p>

                    {strengths.length > 0 ? (
                        <div className="space-y-3">
                            {strengths.map((s, idx) => (
                                <div key={idx} className="bg-white/60 dark:bg-zinc-900/40 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{s.name}</span>
                                        <span className="text-xs text-zinc-500 uppercase tracking-wider">{s.area}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{Math.round(s.accuracy)}%</span>
                                        <span className="text-[10px] text-zinc-400">Exactitud</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-zinc-500 text-center py-8">Continúa practicando para descubrir tus fortalezas especiales.</div>
                    )}
                </div>

                {/* Áreas de Oportunidad */}
                <div className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-zinc-950 border border-orange-100 dark:border-orange-900/50 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingDown className="text-orange-600 dark:text-orange-400" />
                        <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100">Áreas de Oportunidad ⚠️</h3>
                    </div>
                    <p className="text-sm text-orange-700/70 dark:text-orange-300/60 mb-6">Conceptos que el motor sugiere repasar con urgencia.</p>

                    {weaknesses.length > 0 ? (
                        <div className="space-y-3">
                            {weaknesses.map((w, idx) => (
                                <div key={idx} className="bg-white/60 dark:bg-zinc-900/40 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{w.name}</span>
                                        <span className="text-xs text-zinc-500 uppercase tracking-wider">{w.area}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-black text-orange-600 dark:text-orange-400">{Math.round(w.accuracy)}%</span>
                                        <span className="text-[10px] text-zinc-400">Exactitud</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-zinc-500 text-center py-8">No tenemos datos suficientes de áreas débiles. ¡Sigue así!</div>
                    )}
                </div>

            </div>
        </div>
    );
}
