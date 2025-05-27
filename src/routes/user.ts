import express from 'express';
import { 
  getUserProfile,
  followUser,
  unfollowUser
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/:userId', getUserProfile);
router.post('/:userId/follow', authenticate, followUser);
router.delete('/:userId/follow', authenticate, unfollowUser);

export default router;