const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupEventTypes() {
  try {
    console.log('Setting up initial event types...');

    // KATALOG FAALİYETLER - Specific catalog activities
    const eventTypes = [
      {
        name: 'Pes turnuvası',
        description: 'PES video oyunu turnuvası'
      },
      {
        name: 'Sucuk ekmek',
        description: 'Sucuk ekmek etkinliği'
      },
      {
        name: 'Nerf',
        description: 'Nerf oyunu aktivitesi'
      },
      {
        name: 'Tenis turnuvası',
        description: 'Tenis turnuvası'
      },
      {
        name: 'Halı saha',
        description: 'Halı saha futbol maçı'
      },
      {
        name: 'Havuz',
        description: 'Havuz etkinliği'
      },
      {
        name: 'Satranç turnuvası',
        description: 'Satranç turnuvası'
      },
      {
        name: 'Geleneksel piknik etkinliği',
        description: 'Geleneksel piknik etkinliği'
      },
      {
        name: 'Fidan dikimi',
        description: 'Fidan dikimi aktivitesi'
      },
      {
        name: 'Kompozisyon yarışması',
        description: 'Kompozisyon yarışması'
      },
      {
        name: 'Kitap okuma günleri',
        description: 'Kitap okuma günleri'
      },
      {
        name: 'Sabah namaz buluşması',
        description: 'Sabah namaz buluşması'
      },
      {
        name: 'Ney eğitimi',
        description: 'Ney eğitimi dersleri'
      },
      {
        name: 'Çiğköfte etkinlikleri',
        description: 'Çiğköfte etkinlikleri'
      },
      {
        name: 'Atölye faaliyetleri',
        description: 'Çeşitli atölye faaliyetleri'
      },
      {
        name: 'Bilge teknesi- Tarih',
        description: 'Bilge teknesi tarih dersleri'
      },
      {
        name: 'Bilge teknesi- Arapça',
        description: 'Bilge teknesi Arapça dersleri'
      },
      {
        name: 'Aylık sohbet katılımı',
        description: 'Aylık sohbet katılımı'
      }
    ];

    for (const eventType of eventTypes) {
      const existingType = await prisma.eventType.findUnique({
        where: { name: eventType.name }
      });

      if (!existingType) {
        await prisma.eventType.create({
          data: eventType
        });
        console.log(`Created event type: ${eventType.name}`);
      } else {
        console.log(`Event type already exists: ${eventType.name}`);
      }
    }

    console.log('Event types setup completed successfully!');
  } catch (error) {
    console.error('Error setting up event types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupEventTypes().catch(console.error);
}

module.exports = { setupEventTypes };