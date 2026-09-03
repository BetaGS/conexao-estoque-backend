import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.delete('/me', authMiddleware, deleteAccount);

export default router;