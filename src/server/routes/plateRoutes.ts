import express from 'express';
import { plateController } from '../controllers/plateController';

const router = express.Router();

// Plate Types
router.get('/types', plateController.getAllTypes);
router.get('/types/:id', plateController.getTypeById);
router.post('/types', plateController.createType);
router.put('/types/:id', plateController.updateType);
router.delete('/types/:id', plateController.deleteType);

// Plate Movements
router.post('/movements', plateController.createMovement);
router.get('/movements', plateController.getMovements);

// Stock overview
router.get('/stock', plateController.getStock);

export default router;