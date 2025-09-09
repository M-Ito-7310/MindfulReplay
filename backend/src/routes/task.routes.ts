import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

// Task CRUD operations
router.post('/', TaskController.createTask);
router.get('/', TaskController.getTasks);
router.get('/search', TaskController.searchTasks);
router.get('/stats', TaskController.getTaskStats);
router.get('/overdue', TaskController.getOverdueTasks);
router.get('/upcoming', TaskController.getUpcomingTasks);
router.get('/dashboard', TaskController.getDashboard);
router.get('/:id', TaskController.getTask);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

// Task actions
router.post('/:id/complete', TaskController.completeTask);
router.post('/:id/reopen', TaskController.reopenTask);

// Create task from memo
router.post('/from-memo/:memoId', TaskController.createTaskFromMemo);

export default router;