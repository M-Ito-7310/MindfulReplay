import { Router } from 'express';
import { ReminderController } from '../controllers/ReminderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All reminder routes require authentication
router.use(authenticateToken);

// Basic reminder endpoints
router.get('/', ReminderController.getReminders);
router.post('/', ReminderController.createReminder);

export default router;