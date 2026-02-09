// src/server/prismaClient.ts
// Этот файл будет экспортировать единый экземпляр PrismaClient
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Создаем пул подключений для Prisma Adapter
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql:///ctp_service?host=/var/run/postgresql',
});

// Создаем адаптер
const adapter = new PrismaPg(pool);

// Инициализируем Prisma Client с адаптером
const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
});

export { prisma };