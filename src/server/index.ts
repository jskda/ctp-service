// src/server/index.ts
import app, { PORT } from './app';
import { prisma } from './prismaClient'; // Импортируем экземпляр PrismaClient из нового файла

const startServer = async () => {
  try {
    await prisma.$connect(); // Подключаемся к базе данных через глобальный экземпляр
    console.log('🔌 Подключено к базе данных');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();