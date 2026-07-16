import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Reserva } from '../models/Reserva';
import { Cancha } from '../models/Cancha';
import { Horario } from '../models/Horario';
import { ReservaService } from '../services/ReservaService';
import { Op } from 'sequelize';

export class ReservaController {
  
  /**
   * Registra una nueva reserva validando el ciclo de vida del software y reglas del negocio
   */
  public static async crear(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { cancha_id, fecha_reserva, hora_inicio, hora_fin } = req.body;
      
      // Extraer el ID del usuario inyectado de forma segura por el token JWT
      const usuario_id = req.usuarioUser?.id;
      if (!usuario_id) {
        res.status(401).json({ error: 'Usuario no autenticado o token ausente.' });
        return;
      }

      // 1. Regla de Negocio: Evitar registros en fechas pasadas
      const fechaIngresada = new Date(`${fecha_reserva}T00:00:00`);
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);
      
      if (fechaIngresada < fechaActual) {
        res.status(400).json({ error: 'No se pueden realizar reservas en fechas pasadas' });
        return;
      }

      // 2. Comprobar que la cancha de destino exista en el sistema
      const cancha = await Cancha.findByPk(cancha_id);
      if (!cancha) {
        res.status(404).json({ error: 'La cancha especificada no existe' });
        return;
      }

      // 3. Regla de Negocio: Validar horario operativo del día seleccionado
      const fechaObj = new Date(`${fecha_reserva}T00:00:00`);
      const diaSemana = fechaObj.getDay(); // 0 = Domingo, 1 = Lunes...

      const horarioEstablecido = await Horario.findOne({
        where: {
          cancha_id,
          dia_semana: diaSemana,
          hora_inicio: { [Op.lte]: hora_inicio },
          hora_fin: { [Op.gte]: hora_fin }
        }
      });

      if (!horarioEstablecido) {
        res.status(400).json({ error: 'El horario solicitado excede el horario operativo de la cancha' });
        return;
      }

      // 4. Aseguramiento de Calidad: Validar y prevenir solapamientos/cruces con reservas activas
      const reservaSolapada = await Reserva.findOne({
        where: {
          cancha_id,
          fecha_reserva,
          estado: { [Op.ne]: 'CANCELADO' },
          [Op.and]: [
            { hora_inicio: { [Op.lt]: hora_fin } },
            { hora_fin: { [Op.gt]: hora_inicio } }
          ]
        }
      });

      if (reservaSolapada) {
        res.status(400).json({ error: 'El horario solicitado ya se encuentra reservado por otro usuario' });
        return;
      }

      // 5. Lógica Matemática Unitaria: Calcular el monto exacto a cobrar
      const total_pago = ReservaService.calcularTotalPago(cancha.precio_hora, hora_inicio, hora_fin);

      // 6. Persistencia e Inserción del Registro
      const nuevaReserva = await Reserva.create({
        usuario_id,
        cancha_id,
        fecha_reserva,
        hora_inicio,
        hora_fin,
        total_pago,
        estado: 'APROBADO'
      });

      res.status(201).json(nuevaReserva);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al procesar la reserva' });
    }
  }

  /**
   * Recupera las separaciones pertenecientes únicamente al usuario logueado
   */
  public static async listarMisReservas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuario_id = req.usuarioUser?.id;
      const reservas = await Reserva.findAll({ where: { usuario_id } });
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
      const reservas = await Reserva.findAll();
      res.status(200).json(reservas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}