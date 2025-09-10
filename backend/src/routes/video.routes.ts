import { Router } from 'express';
import { VideoController } from '../controllers/VideoController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All video routes require authentication
router.use(authenticateToken);

// Video CRUD operations
router.post('/', VideoController.saveVideo);
router.get('/', VideoController.getVideos);
router.get('/search', VideoController.searchVideos);
router.get('/preview', VideoController.previewVideo);
router.get('/:id', VideoController.getVideo);
router.put('/:id', VideoController.updateVideo);
router.delete('/:id', VideoController.deleteVideo);

// Video actions
router.post('/:id/watch', VideoController.markAsWatched);

export default router;