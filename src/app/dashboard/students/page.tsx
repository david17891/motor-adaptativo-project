import prisma from "@/lib/prisma";
import { createStudent, deleteStudent, importStudentsBatch } from "./actions";

export default async function StudentsPage() {
    const students = await prisma.user.findMany({
        where: { role: "ALUMNO" },
        orderBy: { apellidos: "asc" },
    });

    const groups = await prisma.group.findMany({
        orderBy: { name: "asc" }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Alumnos</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Registra los alumnos que tendrán acceso a la plataforma o visualiza a los matriculados.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Registrar Alumno Individual</h2>
                <form action={async (formData: FormData) => {
                    "use server";
                    await createStudent(formData);
                }} className="flex flex-col sm:flex-row gap-4 items-end">

                    <div className="space-y-2 flex-grow">
                        <label htmlFor="nombre" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre(s)</label>
                        <input type="text" id="nombre" name="nombre" required placeholder="Ej. Juan" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="space-y-2 flex-grow">
                        <label htmlFor="apellidos" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Apellidos</label>
                        <input type="text" id="apellidos" name="apellidos" required placeholder="Pérez Gómez" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="space-y-2 flex-grow">
                        <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Correo Electrónico</label>
                        <input type="email" id="email" name="email" required placeholder="juan@escuela.com" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="space-y-2 flex-grow">
                        <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Clave (Opcional)</label>
                        <input type="text" id="password" name="password" placeholder="Auto-generar" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="space-y-2 flex-grow">
                        <label htmlFor="individualGroupId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Grupo</label>
                        <select id="individualGroupId" name="groupId" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="none">-- (Sin grupo) --</option>
                            {groups.map((g: any) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm h-[38px]">
                        Registrar
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Carga Masiva de Alumnos (JSON)</h2>
                <form action={async (formData: FormData) => {
                    "use server";
                    await importStudentsBatch(formData);
                }} className="space-y-4">

                    <div className="space-y-2">
                        <label htmlFor="groupId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Asignación Directa de Grupo (Opcional)</label>
                        <select id="groupId" name="groupId" className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="none">-- No asignar a ningún grupo todavía --</option>
                            {groups.map((g: any) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="jsonBatch" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Pega el array JSON de estudiantes (ej. Excel convertido a JSON por ChatGPT)
                            </label>

                            {/* Bloque de Esquema Visual (Ayuda) */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Formato JSON Esperado (Copia este ejemplo):</p>
                                <pre className="text-xs bg-white dark:bg-zinc-950 border border-blue-100 dark:border-zinc-800 p-3 rounded text-blue-900 dark:text-blue-400 overflow-x-auto select-all">
                                    {`[
  {
    "nombre": "Juan",
    "apellidos": "Pérez",
    "email": "juan.perez@escuela.edu",
    "password": "miPassword123"
  },
  {
    "nombre": "María",
    "apellidos": "Gómez",
    "email": "maria.gomez@escuela.edu",
    "password": "claveSegura!"
  }
]`}
                                </pre>
                            </div>
                        </div>

                        <textarea
                            id="jsonBatch"
                            name="jsonBatch"
                            required
                            rows={5}
                            placeholder="[\n  { &#34;nombre&#34;: &#34;Ana&#34;, &#34;apellidos&#34;: &#34;Sánchez&#34;, &#34;email&#34;: &#34;ana@es.com&#34;, &#34;password&#34;: &#34;mipass123&#34; }\n]"
                            className="w-full px-4 py-2 font-mono text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="px-6 py-2 bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 font-medium transition-colors shadow-sm">
                            Importar Alumnos
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-3">Alumno</th>
                            <th className="px-6 py-3">Correo y Acceso</th>
                            <th className="px-6 py-3">Fecha Registro</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                    No hay alumnos registrados aún.
                                </td>
                            </tr>
                        ) : (
                            students.map((student: any) => (
                                <tr key={student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                                                {student.nombre[0]}{student.apellidos[0]}
                                            </div>
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{student.apellidos}, {student.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">{student.email}</span>
                                            {student.passwordHash.startsWith('RAW:') ? (
                                                <span className="text-[10px] text-green-600 font-mono mt-1 w-max px-1.5 py-0.5 border border-green-200 bg-green-50 rounded">
                                                    Clave: {student.passwordHash.split('|||')[0].replace('RAW:', '')}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-400 font-mono mt-1 w-max px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded italic">
                                                    Clave: [ENCRIPTADA]
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs">
                                        {student.createdAt.toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <form action={async () => { "use server"; await deleteStudent(student.id); }}>
                                            <button type="submit" className="text-red-500 hover:text-red-600 font-medium text-sm transition-colors cursor-pointer">
                                                Dar de Baja
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
    );
}
