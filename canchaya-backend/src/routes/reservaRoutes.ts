import { Router } from 'express';
import { ReservaController } from '../controllers/ReservaController';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, ReservaController.crear);
router.get('/me', authMiddleware, ReservaController.listarMisReservas);
router.get('/reportes', authMiddleware, roleMiddleware('ADMIN'), ReservaController.obtenerReportes);
router.get('/', authMiddleware, ReservaController.listarTodas);
router.put('/:id/cancelar', authMiddleware, ReservaController.cancelar);

export default router;