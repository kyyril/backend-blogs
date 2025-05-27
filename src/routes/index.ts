import express from 'express';
import authRoutes from './auth';
import blogRoutes from './blog';
import userRoutes from './user';
import commentRoutes from './comment';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/users', userRoutes);
router.use('/', commentRoutes);

export default router;