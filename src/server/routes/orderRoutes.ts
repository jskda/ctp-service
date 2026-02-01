import express from 'express';
import { orderController } from '../controllers/orderController';

const router = express.Router();

router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);
router.post('/', orderController.create);
router.post('/:id/start-processing', orderController.startProcessing);
router.post('/:id/complete', orderController.complete);

export default router;