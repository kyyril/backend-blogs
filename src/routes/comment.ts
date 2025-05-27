import express from 'express';
import { 
  createComment,
  getComments
} from '../controllers/commentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/blogs/:blogId/comments', authenticate, createComment);
router.get('/blogs/:blogId/comments', getComments);

export default router;