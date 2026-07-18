import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Cancha } from '../models/Cancha';
import { Horario } from '../models/Horario';
import { Auditoria } from '../models/Auditoria';

export class CanchaController {

  /**
   * Listar canchas. Los clientes solo ven las activas, los admins ven todas.
   */
  public static async listar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const esAdmin = req.usuarioUser?.rol === 'ADMIN';
      const whereClause = esAdmin ? {} : { activo: true };

      const canchas = await Cancha.findAll({ where: whereClause });
      res.status(200).json(canchas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Crear nueva cancha (Admin)
   */
  public static async crear(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { nombre, tipo_suelo, precio_hora, deporte } = req.body;

      const nuevaCancha = await Cancha.create({
        nombre,
        tipo_suelo,
        precio_hora,
        deporte: deporte || 'FÚTBOL',
        activo: true
      });

      // Crear horarios operativos por defecto (08:00 a 22:00) para todos los días de la semana
      for (let dia = 0; dia <= 6; dia++) {
        await Horario.create({
          cancha_id: nuevaCancha.id,
          dia_semana: dia,
          hora_inicio: '08:00:00',
          hora_fin: '22:00:00'
        });
      }

      await Auditoria.create({
        usuario_id: req.usuarioUser?.id || null,
        accion: 'CANCHA_CREACIÓN',
        detalles: `Cancha #${nuevaCancha.id} (${nombre}) creada con horarios operativos por defecto.`
      });

      res.status(201).json(nuevaCancha);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Actualizar cancha (Admin)
   */
  public static async actualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre, tipo_suelo, precio_hora, deporte, activo } = req.body;

      const cancha = await Cancha.findByPk(id);
      if (!cancha) {
        res.status(404).json({ error: 'La cancha no existe' });
        return;
      }

      await cancha.update({
        nombre,
        tipo_suelo,
        precio_hora,
        deporte,
        activo
      });

      await Auditoria.create({
        usuario_id: req.usuarioUser?.id || null,
        accion: 'CANCHA_ACTUALIZACIÓN',
        detalles: `Cancha #${id} actualizada. Activo: ${activo}, Precio: S/. ${precio_hora}.`
      });

      res.status(200).json(cancha);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Desactivar cancha (Admin) - Soft delete para preservar histórico de reservas
   */
  public static async desactivar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cancha = await Cancha.findByPk(id);
      if (!cancha) {
        res.status(404).json({ error: 'La cancha no existe' });
        return;
      }

      await cancha.update({ activo: false });

      await Auditoria.create({
        usuario_id: req.usuarioUser?.id || null,
        accion: 'CANCHA_DESACTIVACIÓN',
        detalles: `Cancha #${id} desactivada (Soft-Delete) para preservar reservas históricas.`
      });

      res.status(200).json({ mensaje: 'Cancha desactivada con éxito', message: 'Cancha desactivada con éxito', cancha });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
