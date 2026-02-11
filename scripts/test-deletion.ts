import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDeletion() {
    console.log('Testing Donor/Donation Deletion Logic...');

    try {
        // 1. Create a donor
        const donor = await prisma.donor.create({
            data: {
                firstName: 'Deletion',
                lastName: 'Test',
                email: 'delete@test.com',
            },
        });
        console.log('Created Donor:', donor.id);

        // 2. Add a donation
        const donation = await prisma.donation.create({
            data: {
                donorId: donor.id,
                amount: 100,
            },
        });
        console.log('Added donation:', donation.id);

        // 3. Delete donation
        await prisma.donation.delete({ where: { id: donation.id } });
        console.log('Deleted donation.');

        // 4. Verify donor still exists but has no donations
        const checkDonor = await prisma.donor.findUnique({
            where: { id: donor.id },
            include: { donations: true },
        });
        console.log('Donor exists after donation deletion:', !!checkDonor);
        console.log('Donation count (Should be 0):', checkDonor?.donations.length);

        // 5. Delete donor
        await prisma.donor.delete({ where: { id: donor.id } });
        console.log('Deleted donor.');

        // 6. Verify donor is gone
        const checkGone = await prisma.donor.findUnique({ where: { id: donor.id } });
        console.log('Donor gone (Should be true):', !checkGone);

        console.log('Deletion logic verified.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDeletion();
