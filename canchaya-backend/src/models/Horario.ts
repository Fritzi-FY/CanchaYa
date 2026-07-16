import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { Cancha } from './Cancha';

export class Horario extends Model {
  public id!: number;
  public cancha_id!: number;
  public dia_semana!: number;
  public hora_inicio!: string;
  public hora_fin!: string;
}

Horario.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cancha_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Cancha, key: 'id' }
    },
    dia_semana: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, max: 6 } },
    hora_inicio: { type: DataTypes.TIME, allowNull: false },
    hora_fin: { type: DataTypes.TIME, allowNull: false }
  },
  { sequelize, tableName: 'Horarios', timestamps: false }
);

Cancha.hasMany(Horario, { foreignKey: 'cancha_id', onDelete: 'CASCADE' });
Horario.belongsTo(Cancha, { foreignKey: 'cancha_id' });