"use client";

import { useTransition, useState } from "react";
import { loginStudent } from "./actions";

export default function StudentLoginPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl mb-4 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6V8m0 0l9-5-9-5-9 5 9 5z" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Portal del Estudiante</h1>
                    <p className="text-zinc-500 mt-2 text-sm">Ingresa con tu correo y contraseña proporcionados por tu profesor.</p>
                </div>

                <form action={(formData) => {
                    startTransition(async () => {
                        setError(null);
                        const result = await loginStudent(formData);
                        if (result?.error) {
                            setError(result.error);
                        }
                    });
                }} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Ingresando...' : 'Entrar a mis Evaluaciones'}
                    </button>
                </form>
            </div>
        </div>
    );
}
