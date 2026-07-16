import { Router } from 'express';
import { ReservaController } from '../controllers/ReservaController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Asegúrate de que use el middleware de autenticación y el método correcto
router.post('/', authMiddleware, ReservaController.crear);
router.get('/me', authMiddleware, ReservaController.listarMisReservas);
router.get('/', authMiddleware, ReservaController.listarTodas);

export default router;