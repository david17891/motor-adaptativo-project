"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <button
            onClick={() => {
                if (typeof window !== "undefined") {
                    window.print();
                }
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition"
        >
            <Printer size={20} />
            <span>Imprimir PDF</span>
        </button>
    );
}
