import express from 'express';
import { clientController } from '../controllers/clientController';

const router = express.Router();

router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.post('/', clientController.create);
router.put('/:id/tech-notes', clientController.updateTechNotes);

export default router;