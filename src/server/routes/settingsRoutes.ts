import express from 'express';
import { settingsController } from '../controllers/settingsController';

const router = express.Router();

// ============================================
// System Settings
// ============================================
router.get('/system', settingsController.getSystemSettings);
router.put('/system', settingsController.updateSystemSettings);

// ============================================
// Event Log Settings
// ============================================
router.get('/event-log', settingsController.getEventLogSettings);
router.put('/event-log', settingsController.updateEventLogSettings);

// ============================================
// Plate Stock Info
// ============================================
router.get('/plates/stock', settingsController.getPlateStock);

// ============================================
// Update Plate Threshold
// ============================================
router.put('/plates/types/:plateTypeId/threshold', settingsController.updatePlateThreshold);

// ============================================
// System Statistics
// ============================================
router.get('/stats', settingsController.getStats);

export default router;