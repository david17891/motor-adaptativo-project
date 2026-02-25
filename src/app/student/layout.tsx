import React from "react";
import { logoutStudent } from "./login/actions";
import { LogOut } from "lucide-react";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col">
            <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm transition-colors">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-inner">
                        <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
                        Adaptativo <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 hidden sm:inline-block ml-2 px-2 py-0.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 rounded-full">Portal Estudiantil</span>
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-sm text-right">
                        <p className="font-bold text-zinc-800 dark:text-zinc-200">Menú Alumno</p>
                        <p className="text-xs text-zinc-500">Mis Evaluaciones</p>
                    </div>
                    <form action={logoutStudent}>
                        <button type="submit" className="flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-red-600 dark:hover:text-red-400">
                            <span className="hidden sm:inline text-sm font-medium">Salir</span>
                            <LogOut size={18} />
                        </button>
                    </form>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>

            <footer className="py-6 text-center text-sm text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
                &copy; {new Date().getFullYear()} Motor Adaptativo. Todos los derechos reservados.
            </footer>
        </div>
    );
}
