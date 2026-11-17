import express from 'express';
import { getProfile, getDashboard } from '../controllers/accountController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.get('/dashboard', authMiddleware, getDashboard);

export default router;
