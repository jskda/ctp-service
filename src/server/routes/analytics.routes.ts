import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router();

router.get('/process-controls', analyticsController.getProcessControls);
router.get('/summary', analyticsController.getSummary);
router.get('/plate-formats', analyticsController.getPlateFormats);

export default router;