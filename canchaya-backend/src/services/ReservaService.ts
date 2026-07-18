import { Op } from 'sequelize';
import { Reserva } from '../models/Reserva';
import { Cancha } from '../models/Cancha';
import { Horario } from '../models/Horario';
import { Auditoria } from '../models/Auditoria';

export class ReservaService {

  public static calcularTotalPago(precioHora: number, horaInicio: string, horaFin: string): number {
    if (!horaInicio || !horaFin || !horaInicio.includes(':') || !horaFin.includes(':')) {
      throw new Error('Formato de hora inválido. Debe ser HH:MM');
    }

    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);

    if (isNaN(hInicio) || isNaN(mInicio) || isNaN(hFin) || isNaN(mFin)) {
      throw new Error('Los valores de tiempo contienen caracteres no numéricos');
    }

    const minutosInicio = hInicio * 60 + mInicio;
    const minutosFin = hFin * 60 + mFin;

    if (minutosFin <= minutosInicio) {
      throw new Error('La hora de fin debe ser posterior a la hora de inicio');
    }

    const horasTotales = (minutosFin - minutosInicio) / 60;
    return Number((precioHora * horasTotales).toFixed(2));
  }

  public static async verificarSolapamiento(
    canchaId: number,
    fecha: string,
    horaInicio: string,
    horaFin: string
  ): Promise<boolean> {
    const reservaSolapada = await Reserva.findOne({
      where: {
        cancha_id: canchaId,
        fecha_reserva: fecha,
        estado: { [Op.ne]: 'CANCELADO' },
        [Op.and]: [
          { hora_inicio: { [Op.lt]: horaFin } },
          { hora_fin: { [Op.gt]: horaInicio } }
        ]
      }
    });
    return !!reservaSolapada;
  }

  public static async verificarDisponibilidadHoraria(
    canchaId: number,
    fecha: string,
    horaInicio: string,
    horaFin: string
  ): Promise<boolean> {
    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay();

    const horarioEstablecido = await Horario.findOne({
      where: {
        cancha_id: canchaId,
        dia_semana: diaSemana,
        hora_inicio: { [Op.lte]: horaInicio },
        hora_fin: { [Op.gte]: horaFin }
      }
    });
    return !!horarioEstablecido;
  }

  public static async crearReserva(data: {
    usuario_id: number;
    cancha_id: number;
    fecha_reserva: string;
    hora_inicio: string;
    hora_fin: string;
  }) {
    const cancha = await Cancha.findByPk(data.cancha_id);
    if (!cancha) throw new Error('La cancha especificada no existe');
    if (!cancha.activo) throw new Error('La cancha se encuentra desactivada actualmente');

    const fechaActualStr = new Date().toISOString().split('T')[0];
    if (data.fecha_reserva < fechaActualStr) {
      throw new Error('No se pueden realizar reservas en fechas pasadas');
    }

    const estaDisponible = await this.verificarDisponibilidadHoraria(
      data.cancha_id, data.fecha_reserva, data.hora_inicio, data.hora_fin
    );
    if (!estaDisponible) {
      throw new Error('La cancha no opera en el horario solicitado para ese día de la semana');
    }

    const haySolapamiento = await this.verificarSolapamiento(
      data.cancha_id, data.fecha_reserva, data.hora_inicio, data.hora_fin
    );
    if (haySolapamiento) {
      throw new Error('El horario solicitado ya se encuentra reservado por otro usuario');
    }

    const total_pago = this.calcularTotalPago(cancha.precio_hora, data.hora_inicio, data.hora_fin);

    const nuevaReserva = await Reserva.create({
      usuario_id: data.usuario_id,
      cancha_id: data.cancha_id,
      fecha_reserva: data.fecha_reserva,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      total_pago,
      estado: 'APROBADO'
    });

    // Registrar en auditoría
    await Auditoria.create({
      usuario_id: data.usuario_id,
      accion: 'RESERVA_CREACIÓN',
      detalles: `Reserva #${nuevaReserva.id} creada para la cancha #${data.cancha_id} (${cancha.nombre}) por S/. ${total_pago}.`
    });

    return nuevaReserva;
  }

  public static async cancelarReserva(reservaId: number, usuarioId: number, esAdmin: boolean): Promise<Reserva> {
    const reserva = await Reserva.findByPk(reservaId);
    if (!reserva) {
      throw new Error('La reserva especificada no existe');
    }

    if (reserva.getDataValue('estado') === 'CANCELADO') {
      throw new Error('La reserva ya se encuentra cancelada');
    }

    if (!esAdmin && reserva.getDataValue('usuario_id') !== usuarioId) {
      throw new Error('No tiene permisos para cancelar esta reserva');
    }

    const totalPago = Number(reserva.getDataValue('total_pago'));
    const fechaReserva = reserva.getDataValue('fecha_reserva');
    const horaInicio = reserva.getDataValue('hora_inicio');

    // Calcular horas hasta el inicio de la reserva
    const fechaReservaStart = new Date(`${fechaReserva}T${horaInicio}`);
    const ahora = new Date();
    const diffMs = fechaReservaStart.getTime() - ahora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    let reembolso = 0;
    let penalidad = 0;

    // FR-012 Política de cancelación determinista
    if (diffHoras >= 24) {
      reembolso = totalPago;
      penalidad = 0;
    } else if (diffHoras >= 2) {
      reembolso = Number((totalPago * 0.5).toFixed(2));
      penalidad = Number((totalPago * 0.5).toFixed(2));
    } else {
      reembolso = 0;
      penalidad = totalPago;
    }

    reserva.set('estado', 'CANCELADO');
    reserva.set('reembolso', reembolso);
    reserva.set('penalidad', penalidad);
    await reserva.save();

    // Registrar en auditoría
    await Auditoria.create({
      usuario_id: usuarioId,
      accion: 'CANCELACIÓN',
      detalles: `Reserva #${reservaId} cancelada por usuario #${usuarioId}. Reembolso: S/. ${reembolso}, Penalidad: S/. ${penalidad}.`
    });

    return reserva;
  }
}