import prisma from "@/lib/prisma";
import { createSubjectArea, createSubjectTopic } from "./actions";
import { BookOpen, FolderTree, PlusCircle } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CurriculumManagementPage() {
    // const adminToken = (await cookies()).get("adminToken")?.value;
    // if (!adminToken) redirect("/admin");

    const subjectAreas = await prisma.subjectArea.findMany({
        include: {
            topics: true
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <FolderTree className="text-indigo-600 dark:text-indigo-400" />
                    Catálogo Curricular (Árbol de Conocimiento)
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mt-2">
                    Define las áreas y temas autorizados para tu institución. Esto asegura que al crear preguntas, los profesores seleccionen
                    nombres exactos, evitando errores ortográficos que romperían el Motor Adaptativo y las Estadísticas.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">

                {/* Visualizador del Árbol */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold">Estructura Actual</h2>

                    {subjectAreas.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 shadow-sm">
                            El árbol de conocimiento está vacío. Comienza creando un Área Global.
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {subjectAreas.map(area => (
                                <div key={area.id} className="bg-white dark:bg-zinc-950 border-2 border-indigo-100 dark:border-indigo-900/40 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 border-b border-indigo-100 dark:border-indigo-900/40 flex justify-between items-center">
                                        <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                            <BookOpen size={18} /> {area.name}
                                        </h3>
                                        <span className="text-xs bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200 px-2 rounded-full font-bold">
                                            {area.topics.length} subs
                                        </span>
                                    </div>
                                    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[300px] overflow-y-auto">
                                        {area.topics.length === 0 ? (
                                            <li className="px-5 py-6 text-sm text-zinc-500 italic text-center bg-zinc-50/50 dark:bg-zinc-900/10">No hay subtemas dados de alta.</li>
                                        ) : (
                                            area.topics.map(topic => (
                                                <li key={topic.id} className="px-5 py-3.5 text-sm flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group cursor-default">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-800 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-500 transition-colors" />
                                                        <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{topic.name}</span>
                                                    </div>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Formularios de Creación */}
                <div className="space-y-6">

                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                            <PlusCircle size={18} className="text-emerald-500" /> Nueva Área Master
                        </h3>
                        <form action={async (formData) => {
                            "use server";
                            await createSubjectArea(formData);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Nombre (Ej: Matemáticas)</label>
                                <input type="text" name="name" required className="w-full px-3 py-2 border rounded-lg text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                                Crear Área
                            </button>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                            <FolderTree size={18} className="text-blue-500" /> Nuevo Subtema
                        </h3>
                        <form action={async (formData) => {
                            "use server";
                            await createSubjectTopic(formData);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Pertenece al Área</label>
                                <select name="areaId" required className="w-full px-3 py-2 border rounded-lg text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Seleccionar...</option>
                                    {subjectAreas.map(area => (
                                        <option key={area.id} value={area.id}>{area.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Nombre (Ej: Álgebra Lineal)</label>
                                <input type="text" name="name" required className="w-full px-3 py-2 border rounded-lg text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                                Añadir Subtema
                            </button>
                        </form>
                    </div>

                </div>

            </div>
        </div>
    );
}
