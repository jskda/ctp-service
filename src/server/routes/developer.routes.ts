import { Router } from 'express';
import { developerController } from '../controllers/developerController';

const router = Router();

router.get('/status', developerController.getStatus);
router.get('/history', developerController.getHistory);
router.post('/replace', developerController.replace);

export default router;