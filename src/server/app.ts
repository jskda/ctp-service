import express from 'express';
import cors from 'cors';
import { prisma } from './prismaClient';
import orderRoutes from './routes/order.routes';
import clientRoutes from './routes/client.routes';
import plateRoutes from './routes/plate.routes';
import settingsRoutes from './routes/settingsRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение маршрутов
app.use('/api/orders', orderRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/plates', plateRoutes);
app.use('/api/settings', settingsRoutes);

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
export { PORT, prisma };