import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

router.post('/register', AuthController.registrar);
router.post('/login', AuthController.login);

export default router;