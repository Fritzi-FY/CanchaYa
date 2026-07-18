import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { Usuario } from './Usuario';

export class Auditoria extends Model {
  public id!: number;
  public usuario_id!: number | null;
  public accion!: string;
  public detalles!: string | null;
  public fecha!: Date;
}

Auditoria.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Usuario, key: 'id' }
    },
    accion: { type: DataTypes.STRING(100), allowNull: false },
    detalles: { type: DataTypes.TEXT, allowNull: true },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'Auditoria',
    tableName: 'auditorias',
    timestamps: false
  }
);

Usuario.hasMany(Auditoria, { foreignKey: 'usuario_id', onDelete: 'SET NULL' });
Auditoria.belongsTo(Usuario, { foreignKey: 'usuario_id' });
