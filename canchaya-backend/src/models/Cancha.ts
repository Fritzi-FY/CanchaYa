import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Cancha extends Model {
  public id!: number;
  public nombre!: string;
  public tipo_suelo!: string;
  public precio_hora!: number;
  public deporte!: string;
  public activo!: boolean;
}

Cancha.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    tipo_suelo: { type: DataTypes.STRING(50), allowNull: false },
    precio_hora: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0.1 } },
    deporte: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'FÚTBOL' },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  },
  { sequelize, tableName: 'Canchas', timestamps: false }
);