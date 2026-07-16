import { Op } from 'sequelize';
import { Reserva } from '../models/Reserva';
import { Cancha } from '../models/Cancha';
import { Horario } from '../models/Horario';

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

    return await Reserva.create({
      usuario_id: data.usuario_id,
      cancha_id: data.cancha_id,
      fecha_reserva: data.fecha_reserva,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      total_pago,
      estado: 'APROBADO'
    });
  }
}