// src/server/routes/plate.routes.ts
import { Router } from 'express';
import { plateController } from '../controllers/plateController';

const router = Router();

// Plate types
router.get('/types', plateController.getAllTypes);
router.get('/types/:id', plateController.getTypeById);
router.post('/types', plateController.createType);
router.put('/types/:id', plateController.updateType);
router.put('/types/:id/threshold', plateController.updateThreshold);

// Plate movements - incoming
router.post('/movements/purchase', plateController.recordPurchase);
router.post('/movements/return', plateController.recordReturn);
router.post('/movements/correction', plateController.recordCorrection);

// Plate movements - usage
router.post('/movements/usage', plateController.recordUsage);

// Plate movements - scrap
router.post('/movements/scrap/client', plateController.recordScrapClient);
router.post('/movements/scrap/production', plateController.recordScrapProduction);
router.post('/movements/scrap/material', plateController.recordScrapMaterial);

// Plate movements - loss
router.post('/movements/loss/test', plateController.recordLossTest);
router.post('/movements/loss/calibration', plateController.recordLossCalibration);
router.post('/movements/loss/equipment', plateController.recordLossEquipment);

// Stock info
router.get('/stock', plateController.getStock);

export default router;