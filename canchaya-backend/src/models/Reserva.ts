import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { Cancha } from './Cancha';
import { Usuario } from './Usuario';

export class Reserva extends Model {
  public id!: number;
  public usuario_id!: number;
  public cancha_id!: number;
  public fecha_reserva!: string;
  public hora_inicio!: string;
  public hora_fin!: string;
  public total_pago!: number;
  public estado!: string;
  public reembolso!: number;
  public penalidad!: number;
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
    estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'APROBADO' },
    reembolso: { 
      type: DataTypes.DECIMAL(10, 2), 
      defaultValue: 0.00,
      get() {
        const value = this.getDataValue('reembolso');
        return value ? Number(value) : 0;
      }
    },
    penalidad: { 
      type: DataTypes.DECIMAL(10, 2), 
      defaultValue: 0.00,
      get() {
        const value = this.getDataValue('penalidad');
        return value ? Number(value) : 0;
      }
    }
  },
  {
    sequelize,
    modelName: 'Reserva',
    tableName: 'reservas',
    timestamps: false
  }
);

Reserva.belongsTo(Cancha, { foreignKey: 'cancha_id' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Cancha.hasMany(Reserva, { foreignKey: 'cancha_id' });
Usuario.hasMany(Reserva, { foreignKey: 'usuario_id' });