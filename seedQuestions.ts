import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.question.createMany({
        data: [
            { area: "Historia", difficultyLevel: 2, content: { text: "¿En qué año llegó Cristóbal Colón a América?", topics: ["Historia Universal"] }, options: [{ text: "1492", is_correct: true }, { text: "1810", is_correct: false }, { text: "1914", is_correct: false }, { text: "1521", is_correct: false }] },
            { area: "Historia", difficultyLevel: 1, content: { text: "¿Quién fue el primer presidente de México?", topics: ["Historia de México"] }, options: [{ text: "Guadalupe Victoria", is_correct: true }, { text: "Benito Juárez", is_correct: false }, { text: "Porfirio Díaz", is_correct: false }, { text: "Francisco I. Madero", is_correct: false }] },
            { area: "Biología", difficultyLevel: 3, content: { text: "¿Cuál es el organelo encargado de la respiración celular?", topics: ["Célula"] }, options: [{ text: "Mitocondria", is_correct: true }, { text: "Núcleo", is_correct: false }, { text: "Ribosoma", is_correct: false }, { text: "Aparato de Golgi", is_correct: false }] },
            { area: "Biología", difficultyLevel: 2, content: { text: "¿Qué molécula es la principal portadora de energía en la célula?", topics: ["Metabolismo"] }, options: [{ text: "ATP", is_correct: true }, { text: "ADN", is_correct: false }, { text: "ARN", is_correct: false }, { text: "Glucosa", is_correct: false }] },
            { area: "Física", difficultyLevel: 4, content: { text: "Fórmula de la Segunda Ley de Newton", topics: ["Leyes de Newton", "Dinámica"] }, options: [{ text: "F = ma", is_correct: true }, { text: "E = mc^2", is_correct: false }, { text: "v = d/t", is_correct: false }, { text: "p = m*v", is_correct: false }] },
            { area: "Física", difficultyLevel: 3, content: { text: "¿Cuál es la rapidez de la luz en el vacío?", topics: ["Óptica", "Ondas"] }, options: [{ text: "300,000 km/s", is_correct: true }, { text: "150,000 km/s", is_correct: false }, { text: "340 m/s", is_correct: false }, { text: "3,000 km/s", is_correct: false }] },
            { area: "Inglés", difficultyLevel: 1, content: { text: "What is the translation of 'Apple'?", topics: ["Vocabulario"] }, options: [{ text: "Manzana", is_correct: true }, { text: "Naranja", is_correct: false }, { text: "Pera", is_correct: false }, { text: "Plátano", is_correct: false }] },
            { area: "Inglés", difficultyLevel: 2, content: { text: "What is the simple past tense of 'Go'?", topics: ["Verbos"] }, options: [{ text: "Went", is_correct: true }, { text: "Gone", is_correct: false }, { text: "Goes", is_correct: false }, { text: "Going", is_correct: false }] },
        ]
    });
    console.log("Banco de preguntas precargado con Historia, Biología, Física e Inglés.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
