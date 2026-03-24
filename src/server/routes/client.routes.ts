import express from 'express';
import { clientController } from '../controllers/clientController';

const router = express.Router();

router.get('/', clientController.getAll);
router.get('/active', clientController.getActive);        // новый
router.get('/:id', clientController.getById);
router.post('/', clientController.create);                 // новый
router.put('/:id', clientController.update);
router.delete('/:id', clientController.archive);           // новый

export default router;