// src/server/routes/plateRoutes.ts
import { Router } from 'express';
// Импортируем контроллеры, когда они будут созданы
// import { createPlateType, getAllPlateTypes, getPlateTypeById, setMinStockThreshold, recordPlateIncoming, recordPlateUsage, recordPlateScrap, recordPlateLoss, getCurrentStockLevels, getMovementsForPlateType } from '../controllers/plateController';

const router = Router();

// --- Routes for Plate Types ---
// router.post('/types', createPlateType);
// router.get('/types', getAllPlateTypes);
// router.get('/types/:id', getPlateTypeById);
// router.put('/types/:id/threshold', setMinStockThreshold); // For setting min stock level

// --- Routes for Plate Movements ---
// router.post('/movements/incoming', recordPlateIncoming);
// router.post('/movements/usage', recordPlateUsage);
// router.post('/movements/scrap', recordPlateScrap);
// router.post('/movements/loss', recordPlateLoss);

// --- Routes for Aggregated Views ---
// router.get('/stock', getCurrentStockLevels); // Action: View Current Stock
// router.get('/types/:id/movements', getMovementsForPlateType); // View history for a type

// Пока что добавим заглушку
router.get('/', (req, res) => {
  res.json({ message: 'Plates route placeholder' });
});

export default router;