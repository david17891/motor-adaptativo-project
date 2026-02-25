import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando migración de contraseñas...");
    const users = await prisma.user.findMany({
        where: { role: 'ALUMNO' }
    });

    let count = 0;
    for (const user of users) {
        // bcrypt hashes begin with $2a$, $2b$, or $2y$ and are 60 chars long.
        // Si no empieza con $2, asumiremos que es texto plano y lo encriptaremos.
        if (!user.passwordHash.startsWith('$2')) {
            const hashed = await bcrypt.hash(user.passwordHash, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: hashed }
            });
            console.log(`- Contraseña actualizada para: ${user.email}`);
            count++;
        }
    }

    console.log(`Migración completada. ${count} contraseñas actualizadas.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
