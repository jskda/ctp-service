// src/test-prisma.ts
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Создаём адаптер с подключением
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Передаём адаптер в PrismaClient
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const client = await prisma.client.create({
      data: {
        name: 'Тестовый клиент',
        techNotes: ['Настройка 1', 'Настройка 2']
      }
    });
    console.log('✅ Создан клиент:', client);

    const plateType = await prisma.plateType.create({
      data: {
        format: 'A2',
        manufacturer: 'Kodak',
        minStockThreshold: 10
      }
    });
    console.log('✅ Создан тип пластины:', plateType);

    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        colorMode: 'CMYK',
        status: 'NEW',
        notesSnapshot: client.techNotes
      }
    });
    console.log('✅ Создан заказ:', order);
  } catch (e) {
    console.error('❌ Ошибка при выполнении теста:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('💥 Критическая ошибка:', e);
  process.exit(1);
});