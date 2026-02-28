export const ensureMath = (text: string) => {
    if (!text) return "";
    if (typeof text !== 'string') return text;
    if (text.includes('$')) return text;

    const trimmed = text.trim();
    // Proteger símbolos de comparación que Markdown confunde con etiquetas o blockquotes
    if (trimmed === ">" || trimmed === "<" || trimmed === "=" || trimmed === ">=" || trimmed === "<=") {
        return `$${trimmed}$`;
    }

    const hasLatex = text.includes('\\') || text.includes('{') || text.includes('}');
    const hasMathSymbols = /[<>]=?|\^/.test(text);

    if (hasLatex || hasMathSymbols) {
        // Envolver patrones LaTeX comunes, operadores y símbolos de comparación
        return text.replace(/([+-]?\\[a-z]+({[^{}]*})*|[+-]?\\frac{[^{}]*}{[^{}]*}|[+-]?\\sqrt{[^{}]*}|\\leq|\\geq|\\neq|\\pm|\\times|\\approx|\\cdot|\^|[<>]=?)/gi, (match) => {
            return `$${match}$`;
        });
    }
    return text;
};
