import prisma from "@/lib/prisma";
import { createQuestion, deleteQuestion, deleteAllQuestions, importQuestionsBatch } from "./actions";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ClearBankButton from "./ClearBankButton";

export default async function QuestionsPage(props: { searchParams: Promise<{ area?: string }> }) {
    const searchParams = await props.searchParams;
    const currentAreaFilter = searchParams.area || null;

    const whereClause = currentAreaFilter ? { area: currentAreaFilter } : {};

    const questions = await prisma.question.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
    });

    const uniqueAreasResult = await prisma.question.groupBy({
        by: ['area'],
        _count: { _all: true }
    });

    const availableAreasCounted = uniqueAreasResult
        .map((a: any) => ({ name: a.area, count: a._count._all }))
        .sort((a: any, b: any) => b.count - a.count);

    const availableAreasFilter = availableAreasCounted.map((a: any) => a.name).filter(Boolean);

    // FASE A: Obtener el Catálogo Curricular
    const curriculumAreas = await prisma.subjectArea.findMany({
        where: { isActive: true },
        include: { topics: true },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Banco de Preguntas</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Crea el catálogo de preguntas con 4 incisos. Elige cuál inciso será la respuesta correcta.
                    </p>
                </div>
                {questions.length > 0 && (
                    <ClearBankButton />
                )}
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Nueva Pregunta</h2>
                <form action={async (formData: FormData) => {
                    "use server";
                    await createQuestion(formData);
                }} className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="area" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Área o Materia Principal
                            </label>
                            <select
                                id="area"
                                name="area"
                                required
                                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Selecciona una Materia oficial...</option>
                                {curriculumAreas.map(a => (
                                    <option key={a.id} value={a.name}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="subarea" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Subárea o Unidad (Opcional, pero recomendado)
                            </label>
                            {/* Al no usar client components aquí, permitimos texto pero con datalist del catálogo entero para evitar errores typográficos comunes, idelamente se usa react estados para encadenar selects, pero el datalist funciona bien en server-components rápidos */}
                            <input
                                list="topicsListQ"
                                type="text"
                                id="subarea"
                                name="subarea"
                                placeholder="Ej. Álgebra, Termodinámica..."
                                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <datalist id="topicsListQ">
                                {curriculumAreas.flatMap(a => a.topics).map((t: any) => (
                                    <option key={t.id} value={t.name} />
                                ))}
                            </datalist>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="difficultyLevel" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dificultad (1 al 5)</label>
                            <select
                                id="difficultyLevel"
                                name="difficultyLevel"
                                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="1">1 - Muy Fácil</option>
                                <option value="2">2 - Fácil</option>
                                <option value="3">3 - Intermedio</option>
                                <option value="4">4 - Difícil</option>
                                <option value="5">5 - Muy Difícil</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="topics" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Temas Específicos (Separados por coma)</label>
                        <input
                            type="text"
                            id="topics"
                            name="topics"
                            placeholder="Ej. Álgebra lineal, Ecuaciones, Factorización..."
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <p className="text-xs text-zinc-500">Agrega todos los temas en los que aplica esta pregunta para un diagnóstico adaptativo preciso. Ej: "Ecuaciones, Semana 1"</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="content" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Planteamiento de la Pregunta</label>
                        <textarea
                            id="content"
                            name="content"
                            required
                            rows={3}
                            placeholder="Escribe aquí el texto de la pregunta..."
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        />
                    </div>

                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                        <h3 className="text-sm font-semibold mb-3 text-zinc-800 dark:text-zinc-200">
                            Captura los 4 incisos y marca cuál es el <span className="text-green-600 dark:text-green-400">Correcto</span>:
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[0, 1, 2, 3].map((index) => {
                                const labels = ["A", "B", "C", "D"];
                                return (
                                    <div key={index} className="flex flex-col gap-2 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="correctOption"
                                                value={index}
                                                id={`correct_${index}`}
                                                defaultChecked={index === 0}
                                                className="w-4 h-4 text-blue-600 border-zinc-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor={`correct_${index}`} className="text-xs font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                                Inciso {labels[index]} es el correcto
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            name={`option_${index}`}
                                            required
                                            placeholder={`Texto del inciso ${labels[index]}`}
                                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                        >
                            Guardar Pregunta al Banco
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Carga Masiva con IA (JSON)</h2>
                <form action={async (formData: FormData) => {
                    "use server";
                    await importQuestionsBatch(formData);
                }} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="jsonBatch" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Pega aquí el array JSON generado por la IA (ChatGPT, Claude, etc.)
                        </label>
                        <textarea
                            id="jsonBatch"
                            name="jsonBatch"
                            required
                            rows={6}
                            placeholder="[\n  {\n    &#34;area&#34;: &#34;Matemáticas&#34;, ...\n  }\n]"
                            className="w-full px-4 py-2 font-mono text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        />
                        <details className="text-xs text-zinc-500 cursor-pointer">
                            <summary className="font-medium text-blue-600 dark:text-blue-400">Ver esquema de JSON esperado</summary>
                            <pre className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-x-auto">
                                {`[
  {
    "area": "Matemáticas",
    "subarea": "Álgebra",
    "difficultyLevel": 3,
    "topics": ["Ecuaciones", "Semana 1"],
    "content": "Resuelve la siguiente ecuación: $$ \\\\frac{x}{2} + 3 = 5 $$",
    "options": [
      { "text": "x = 4", "is_correct": true },
      { "text": "x = 2", "is_correct": false },
      { "text": "x = 6", "is_correct": false },
      { "text": "x = 8", "is_correct": false }
    ]
  }
]`}
                            </pre>
                            <p className="mt-2">Puedes enviar este formato exacto a tu IA de preferencia para que te genere las preguntas que necesites copíandola y pegándola aquí. NOTA: Los símbolos de LaTeX como \ fracción, etc deben estar escapados a nivel de String JSON (\\).</p>
                        </details>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 font-medium transition-colors shadow-sm"
                        >
                            Importar JSON
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Preguntas Guardadas {currentAreaFilter && `en ${currentAreaFilter}`}
                    </h2>

                    {availableAreasCounted.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <a href="/dashboard/questions" className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${!currentAreaFilter ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>
                                Todas
                            </a>
                            {availableAreasCounted.map((a: any) => (
                                <a key={a.name} href={`/dashboard/questions?area=${encodeURIComponent(a.name)}`} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${currentAreaFilter === a.name ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/30'}`}>
                                    {a.name}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${currentAreaFilter === a.name ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'}`}>
                                        {a.count}
                                    </span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {questions.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500">
                        El banco de preguntas está vacío. Agrega la primera arriba.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {questions.map((q: any) => {
                            // Parseamos el JSON de forma segura sacando topics y text
                            const contentObj = (typeof q.content === 'object' && q.content !== null) ? q.content : { text: JSON.stringify(q.content) };
                            const contentText = contentObj.text || "";
                            const topics = Array.isArray(contentObj.topics) ? contentObj.topics : [];
                            const options = Array.isArray(q.options) ? q.options : [];
                            const labels = ["A", "B", "C", "D"];

                            return (
                                <div key={q.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <div className="flex items-center flex-wrap gap-2">
                                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                                                {q.area}
                                            </span>
                                            {q.subarea && (
                                                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                                                    {q.subarea}
                                                </span>
                                            )}
                                            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-2 rounded-md">
                                                Dif {q.difficultyLevel}
                                            </span>

                                            {topics.map((t: string, i: number) => (
                                                <span key={i} className="text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                                                    # {t}
                                                </span>
                                            ))}
                                        </div>
                                        <form action={async () => {
                                            "use server";
                                            await deleteQuestion(q.id);
                                        }}>
                                            <button type="submit" className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors">
                                                Borrar
                                            </button>
                                        </form>
                                    </div>

                                    <div className="text-zinc-900 dark:text-zinc-100 font-medium mb-4 whitespace-pre-wrap">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {contentText}
                                        </ReactMarkdown>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                        {options.map((opt: any, index: number) => (
                                            <div
                                                key={opt.id || index}
                                                className={`px-3 py-2 rounded-lg border flex flex-col justify-center ${opt.is_correct
                                                    ? "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 font-medium"
                                                    : "bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-400"
                                                    }`}
                                            >
                                                <div className="flex w-full items-center">
                                                    <span className="font-bold mr-2">{labels[index] || "•"}</span>
                                                    <div className="flex-1 overflow-x-auto">
                                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                            {opt.text}
                                                        </ReactMarkdown>
                                                    </div>
                                                    {opt.is_correct && <span className="ml-2">✔️</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
