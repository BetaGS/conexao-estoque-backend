import { Router } from 'express';
// Adicione deleteAccount aqui na importação:
import { register, login, deleteAccount } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.delete('/me', authMiddleware, deleteAccount);

export default router;