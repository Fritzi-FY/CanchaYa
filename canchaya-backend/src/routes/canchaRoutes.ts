import { Router } from 'express';
import { CanchaController } from '../controllers/CanchaController';
import { authMiddleware, optionalAuthMiddleware, roleMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint público para obtener canchas (filtrado por activo para clientes/visitantes, completo para admins)
router.get('/', optionalAuthMiddleware, CanchaController.listar);

// Endpoints administrativos protegidos
router.post('/', authMiddleware, roleMiddleware('ADMIN'), CanchaController.crear);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), CanchaController.actualizar);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), CanchaController.desactivar);

export default router;
