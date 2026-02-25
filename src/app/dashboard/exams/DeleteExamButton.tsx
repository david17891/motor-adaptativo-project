"use client";

import { useTransition } from "react";
import { deleteExamVersion } from "./actions";

export default function DeleteExamButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (window.confirm("¿Estás seguro de que quieres borrar esta plantilla? Esta acción no se puede deshacer y podría afectar las evaluaciones que dependan de ella.")) {
            startTransition(async () => {
                const res = await deleteExamVersion(id);
                if (res?.error) {
                    alert(res.error);
                }
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors disabled:opacity-50"
            title="Eliminar plantilla"
        >
            {isPending ? "Borrando..." : "🗑️ Eliminar"}
        </button>
    );
}
