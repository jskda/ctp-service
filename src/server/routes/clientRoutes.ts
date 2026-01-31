// src/server/routes/clientRoutes.ts
import { Router } from 'express';
// Импортируем контроллеры, когда они будут созданы
// import { createClient, getAllClients, getClientById, updateClientSettings } from '../controllers/clientController';

const router = Router();

// route: POST /api/clients -> action: Create Client
// router.post('/', createClient);

// route: GET /api/clients -> action: View All Clients
// router.get('/', getAllClients);

// route: GET /api/clients/:id -> action: View Client Details
// router.get('/:id', getClientById);

// route: PUT /api/clients/:id -> action: Change Client Tech Settings
// router.put('/:id', updateClientSettings);

// Пока что добавим заглушку
router.get('/', (req, res) => {
  res.json({ message: 'Clients route placeholder' });
});

export default router;