import express from 'express';
import { orderController } from '../controllers/orderController';

const router = express.Router();

router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);
router.post('/', orderController.create);
router.put('/:id', orderController.update);
router.delete('/:id', orderController.delete);

export default router;