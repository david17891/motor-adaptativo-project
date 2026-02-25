require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
    console.log("Iniciando migración...");
    let prisma;
    try {
        prisma = new PrismaClient();
        console.log("Cliente instanciado.");
        const users = await prisma.user.findMany({ where: { role: 'ALUMNO' } });
        let c = 0;
        for (const u of users) {
            if (!u.passwordHash.startsWith('$2')) {
                const h = await bcrypt.hash(u.passwordHash, 10);
                await prisma.user.update({ where: { id: u.id }, data: { passwordHash: h } });
                c++;
                console.log("Updated", u.email);
            }
        }
        console.log("Total updated:", c);
    } catch (e) {
        console.error("FAIL:", e);
    } finally {
        if (prisma) await prisma.$disconnect();
    }
}
main();
