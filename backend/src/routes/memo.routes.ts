import { Router } from 'express';
import { MemoController } from '../controllers/MemoController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All memo routes require authentication
router.use(authenticateToken);

// Memo CRUD operations
router.post('/', MemoController.createMemo);
router.get('/', MemoController.getMemos);
router.get('/search', MemoController.searchMemos);
router.get('/important', MemoController.getImportantMemos);
router.get('/video/:videoId', MemoController.getVideoMemos);
router.get('/:id', MemoController.getMemo);
router.put('/:id', MemoController.updateMemo);
router.delete('/:id', MemoController.deleteMemo);

// Memo actions
router.post('/:id/convert-to-task', MemoController.convertToTask);
router.post('/:id/toggle-important', MemoController.toggleImportant);

export default router;