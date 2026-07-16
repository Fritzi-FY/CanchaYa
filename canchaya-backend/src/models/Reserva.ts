import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Reserva extends Model {
  // Dejamos la clase vacía para que use los getters/setters nativos de Sequelize
}

Reserva.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    cancha_id: { type: DataTypes.INTEGER, allowNull: false },
    fecha_reserva: { type: DataTypes.DATEONLY, allowNull: false },
    hora_inicio: { type: DataTypes.TIME, allowNull: false },
    hora_fin: { type: DataTypes.TIME, allowNull: false },
    total_pago: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: false,
      get() {
        // Forzamos a que siempre devuelva un número real al leerlo
        const value = this.getDataValue('total_pago');
        return value ? Number(value) : 0;
      }
    },
    estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'APROBADO' }
  },
  {
    sequelize,
    modelName: 'Reserva',
    tableName: 'reservas',
    timestamps: false
  }
);