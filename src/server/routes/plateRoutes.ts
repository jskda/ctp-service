import express from 'express';
import { plateController } from '../controllers/plateController';

const router = express.Router();

// --- Plate Types ---
router.get('/types', plateController.getAllTypes);
router.get('/types/:id', plateController.getTypeById);
router.post('/types', plateController.createType);
router.put('/types/:id/threshold', plateController.updateThreshold);

// --- Plate Movements - Поступление ---
router.post('/movements/purchase', plateController.recordPurchase);
router.post('/movements/return', plateController.recordReturn);
router.post('/movements/correction', plateController.recordCorrection);

// --- Plate Movements - Использование по заказу ---
router.post('/movements/usage', plateController.recordUsage);

// --- Plate Movements - Брак ---
router.post('/movements/scrap/client', plateController.recordScrapClient);
router.post('/movements/scrap/production', plateController.recordScrapProduction);
router.post('/movements/scrap/material', plateController.recordScrapMaterial);

// --- Plate Movements - Производственные потери ---
router.post('/movements/loss/test', plateController.recordLossTest);
router.post('/movements/loss/calibration', plateController.recordLossCalibration);
router.post('/movements/loss/equipment', plateController.recordLossEquipment);

// --- Stock overview ---
router.get('/stock', plateController.getStock);

export default router;