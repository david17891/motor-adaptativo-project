import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando migración de contraseñas...");
    let count = 0;
    const users = await prisma.user.findMany({
        where: { role: 'ALUMNO' }
    });

    for (const user of users) {
        if (!user.passwordHash.startsWith('$2')) {
            const hashed = await bcrypt.hash(user.passwordHash, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: hashed }
            });
            count++;
            console.log(`Updated user ${user.email}`);
        }
    }
    console.log(`Migración completada. ${count} contraseñas actualizadas.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
