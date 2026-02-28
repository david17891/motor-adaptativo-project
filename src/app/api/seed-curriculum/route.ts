import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
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

        let results = [];

        for (const item of curriculum) {
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
                results.push(`Created Area: ${area.name}`);
            }

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
                    results.push(`  Created Topic: ${topicName}`);
                }
            }
        }

        return NextResponse.json({ success: true, seeded: results.length > 0, steps: results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
