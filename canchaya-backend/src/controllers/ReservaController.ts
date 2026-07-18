import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Reserva } from '../models/Reserva';
import { Cancha } from '../models/Cancha';
import { Horario } from '../models/Horario';
import { ReservaService } from '../services/ReservaService';
import { Auditoria } from '../models/Auditoria';
import { Op } from 'sequelize';

export class ReservaController {
  
  /**
   * Registra una nueva reserva validando reglas del negocio y registrando auditoría
   */
  public static async crear(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { cancha_id, fecha_reserva, hora_inicio, hora_fin } = req.body;
      
      const usuario_id = req.usuarioUser?.id;
      if (!usuario_id) {
        res.status(401).json({ error: 'Usuario no autenticado o token ausente.' });
        return;
      }

      // Crear reserva usando el servicio (valida disponibilidad, solapamientos, canchas activas y genera log)
      const nuevaReserva = await ReservaService.crearReserva({
        usuario_id,
        cancha_id: Number(cancha_id),
        fecha_reserva,
        hora_inicio,
        hora_fin
      });

      res.status(201).json(nuevaReserva);
    } catch (error: any) {
      if (error.message === 'La cancha especificada no existe') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || 'Error al procesar la reserva' });
    }
  }

  /**
   * Cancela una reserva aplicando la política de cancelación correspondiente
   */
  public static async cancelar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuario_id = req.usuarioUser?.id;
      if (!usuario_id) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const esAdmin = req.usuarioUser?.rol === 'ADMIN';

      const reservaCancelada = await ReservaService.cancelarReserva(
        Number(id),
        usuario_id,
        esAdmin
      );

      res.status(200).json(reservaCancelada);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al cancelar la reserva' });
    }
  }

  /**
   * Recupera las separaciones pertenecientes únicamente al usuario logueado
   */
  public static async listarMisReservas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuario_id = req.usuarioUser?.id;
      const reservas = await Reserva.findAll({ 
        where: { usuario_id },
        include: [{ model: Cancha, attributes: ['nombre', 'deporte', 'precio_hora'] }]
      });
      res.status(200).json(reservas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Vista de administración: Lista todas las reservas del sistema de forma global
   */
  public static async listarTodas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const reservas = await Reserva.findAll({
        include: [{ model: Cancha, attributes: ['nombre', 'deporte', 'precio_hora'] }]
      });
      res.status(200).json(reservas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Reportes administrativos: Ingresos, Pérdidas y Auditoría con filtrado por rango de fechas
   */
  public static async obtenerReportes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      const whereClause: any = {};
      if (fecha_inicio && fecha_fin) {
        whereClause.fecha_reserva = {
          [Op.between]: [fecha_inicio, fecha_fin]
        };
      }

      const reservas = await Reserva.findAll({
        where: whereClause,
        include: [{ model: Cancha, attributes: ['nombre', 'deporte', 'precio_hora'] }]
      });

      // Cálculos financieros
      let ingresosTotales = 0;
      let perdidasReembolsos = 0;
      let penalidadesCobradas = 0;

      reservas.forEach((r: any) => {
        if (r.estado === 'APROBADO') {
          ingresosTotales += Number(r.total_pago);
        } else if (r.estado === 'CANCELADO') {
          perdidasReembolsos += Number(r.reembolso);
          penalidadesCobradas += Number(r.penalidad);
        }
      });

      // Logs de transacciones globales (Bitácora)
      const auditorias = await Auditoria.findAll({
        include: [{ association: 'Usuario', attributes: ['nombre', 'email'] }],
        order: [['fecha', 'DESC']],
        limit: 50
      });

      res.status(200).json({
        reservas,
        auditorias,
        resumen: {
          ingresosTotales,
          perdidasReembolsos,
          penalidadesCobradas,
          conteoReservas: reservas.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}