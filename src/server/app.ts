//app.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// --- Import Routes ---
import clientRoutes from './routes/clientRoutes';
import orderRoutes from './routes/orderRoutes';
import plateRoutes from './routes/plateRoutes';

// --- Middleware ---
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- Database ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ctp_service',
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running and connected to DB.' });
});

// Подключаем маршруты с префиксом /api
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/plates', plateRoutes);

// --- Error Handling Middleware ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`Error: ${err.stack}`);
  res.status(500).json({ error: 'Something went wrong!' });
});

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  pool.end();
  process.exit(0);
});

export default app;