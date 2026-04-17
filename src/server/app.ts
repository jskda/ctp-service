import express from 'express';
import cors from 'cors';
import { prisma } from './prismaClient';
import orderRoutes from './routes/order.routes';
import clientRoutes from './routes/client.routes';
import plateRoutes from './routes/plate.routes';
import settingsRoutes from './routes/settingsRoutes';
import analyticsRoutes from './routes/analytics.routes';
import developerRoutes from './routes/developer.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/orders', orderRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/plates', plateRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/developer', developerRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
export { PORT, prisma };