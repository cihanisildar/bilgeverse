import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const branches = [
        { name: 'Futbol', description: 'Futbol branşı eğitim ve müsabakaları' },
        { name: 'Basketbol', description: 'Basketbol branşı eğitim ve müsabakaları' },
        { name: 'Voleybol', description: 'Voleybol branşı eğitim ve müsabakaları' },
        { name: 'Yüzme', description: 'Yüzme branşı eğitim ve müsabakaları' },
        { name: 'Okçuluk', description: 'Okçuluk branşı eğitim ve müsabakaları' }
    ];

    console.log('Seeding sport branches...');

    for (const branch of branches) {
        await prisma.sportBranch.upsert({
            where: { name: branch.name },
            update: {},
            create: branch,
        });
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
