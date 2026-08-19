import { PrismaClient } from '@prisma/client';
import { DEFAULT_SPORT_BRANCHES } from '../lib/org-defaults';
import { ROOT_ORG_ID } from '../lib/constants/tenant';

// Bu script uzantısız (tenant filtresi olmayan) client kullanır; kurum bu yüzden
// açıkça verilir. Varsayılan olarak ana kuruma yazar.
const prisma = new PrismaClient();

const organizationId = process.env.ORG_ID || ROOT_ORG_ID;

async function main() {
    console.log(`Seeding sport branches for organization ${organizationId}...`);

    for (const branch of DEFAULT_SPORT_BRANCHES) {
        await prisma.sportBranch.upsert({
            where: { organizationId_name: { organizationId, name: branch.name } },
            update: {},
            create: { ...branch, organizationId },
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
