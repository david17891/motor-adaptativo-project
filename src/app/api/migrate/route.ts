import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    console.log("Iniciando migración de contraseñas...");
    let count = 0;
    try {
        const users = await prisma.user.findMany({
            where: { role: 'ALUMNO' }
        });

        for (const user of users) {
            // bcrypt hashes typically start with $2a$, $2b$, or $2y$ 
            if (!user.passwordHash.startsWith('$2')) {
                const hashed = await bcrypt.hash(user.passwordHash, 10);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { passwordHash: hashed }
                });
                count++;
            }
        }
        return NextResponse.json({ success: true, count });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
