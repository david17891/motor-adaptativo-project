"use client";

import { useTransition } from "react";
import { deleteAllQuestions } from "./actions";

export default function ClearBankButton() {
    const [isPending, startTransition] = useTransition();

    const handleClear = () => {
        if (window.confirm('🚨 ¿ESTÁS SEGURO? Esta acción borrará TODO el banco de preguntas y no se puede deshacer.')) {
            startTransition(async () => {
                await deleteAllQuestions();
            });
        }
    };

    return (
        <button
            onClick={handleClear}
            disabled={isPending}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
        >
            {isPending ? "Borrando..." : "🗑️ Vaciar Banco Completo"}
        </button>
    );
}
