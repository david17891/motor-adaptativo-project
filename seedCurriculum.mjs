import { PrismaClient } from "@prisma/client";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding initial curriculum catalogs...");

    // Basic Structure based on usual subjects
    const curriculum = [
        {
            area: "Matemáticas",
            topics: ["Álgebra", "Aritmética", "Geometría", "Probabilidad y Estadística", "Trigonometría"]
        },
        {
            area: "Español",
            topics: ["Comprensión Lectora", "Gramática", "Ortografía", "Redacción"]
        },
        {
            area: "Ciencias",
            topics: ["Biología", "Física", "Química"]
        }
    ];

    for (const item of curriculum) {
        // Create Area
        let area = await prisma.subjectArea.findUnique({
            where: { name: item.area }
        });

        if (!area) {
            area = await prisma.subjectArea.create({
                data: {
                    name: item.area,
                    description: `Área general de ${item.area}`
                }
            });
            console.log(`Created Area: ${area.name}`);
        } else {
            console.log(`Area ${area.name} already exists.`);
        }

        // Create Topics
        for (const topicName of item.topics) {
            const existingTopic = await prisma.subjectTopic.findUnique({
                where: {
                    areaId_name: {
                        areaId: area.id,
                        name: topicName
                    }
                }
            });

            if (!existingTopic) {
                await prisma.subjectTopic.create({
                    data: {
                        areaId: area.id,
                        name: topicName,
                    }
                });
                console.log(`  Created Topic: ${topicName}`);
            } else {
                console.log(`  Topic ${topicName} already exists in ${area.name}.`);
            }
        }
    }

    console.log("Curriculum seeding completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
