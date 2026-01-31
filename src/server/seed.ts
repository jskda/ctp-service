import { prisma } from './app.js';

async function seed() {
  console.log('🌱 Seeding database...');

  // Очистка данных (осторожно!)
  await prisma.plateMovement.deleteMany();
  await prisma.order.deleteMany();
  await prisma.client.deleteMany();
  await prisma.plateType.deleteMany();

  // Создание типов пластин
  const plateTypes = await prisma.plateType.createMany({
    data: [
      {
        format: 'A4',
        manufacturer: 'Fuji',
        minStockThreshold: 10,
        otherParams: { thickness: '0.3mm', coating: 'thermal' },
      },
      {
        format: 'A3',
        manufacturer: 'Kodak',
        minStockThreshold: 5,
        otherParams: { thickness: '0.2mm', coating: 'UV' },
      },
      {
        format: 'SRA3',
        manufacturer: 'Agfa',
        minStockThreshold: 8,
        otherParams: { thickness: '0.25mm', coating: 'hybrid' },
      },
    ],
  });

  // Создание клиентов
  const clients = await prisma.client.createMany({
    data: [
      {
        name: 'PrintMaster Ltd',
        techNotes: ['Requires color calibration', 'High precision printing'],
      },
      {
        name: 'FastPrint Corp',
        techNotes: ['Bulk orders', 'Standard quality'],
      },
      {
        name: 'EliteGraphics Inc',
        techNotes: ['Premium service', 'Special materials'],
      },
    ],
  });

  // Получаем созданные записи
  const createdPlateTypes = await prisma.plateType.findMany();
  const createdClients = await prisma.client.findMany();

  // Создание заказов
  const orders = await prisma.order.createMany({
    data: [
      {
        clientId: createdClients[0].id,
        colorMode: 'CMYK',
        status: 'DONE',
        notesSnapshot: { priority: 'high', specialInstructions: 'Handle with care' },
      },
      {
        clientId: createdClients[1].id,
        colorMode: 'BLACK',
        status: 'PROCESS',
        notesSnapshot: { rushOrder: true },
      },
      {
        clientId: createdClients[2].id,
        colorMode: 'MULTICOLOR',
        status: 'NEW',
        notesSnapshot: { customColors: ['Pantone 185C', 'Pantone 3005C'] },
      },
    ],
  });

  const createdOrders = await prisma.order.findMany();

  // Создание движений пластин
  await prisma.plateMovement.createMany({
    data: [
      // Входящие движения (покупка)
      {
        plateTypeId: createdPlateTypes[0].id,
        quantity: 50,
        movementType: 'INCOMING',
        reason: 'PURCHASE',
      },
      {
        plateTypeId: createdPlateTypes[1].id,
        quantity: 30,
        movementType: 'INCOMING',
        reason: 'PURCHASE',
      },
      // Исходящие движения (использование в заказах)
      {
        plateTypeId: createdPlateTypes[0].id,
        quantity: -10,
        movementType: 'OUTGOING',
        reason: 'NORMAL_USAGE',
        orderId: createdOrders[0].id,
      },
      {
        plateTypeId: createdPlateTypes[1].id,
        quantity: -5,
        movementType: 'OUTGOING',
        reason: 'NORMAL_USAGE',
        orderId: createdOrders[1].id,
      },
      // Брак производства
      {
        plateTypeId: createdPlateTypes[0].id,
        quantity: -2,
        movementType: 'OUTGOING',
        reason: 'SCRAP_PRODUCTION',
        responsibility: 'PRODUCTION',
      },
    ],
  });

  console.log('✅ Seeding completed!');
}

seed()
  .catch((error) => {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });