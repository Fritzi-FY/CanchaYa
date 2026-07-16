import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Usuario extends Model {}

Usuario.init(
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    nombre: { 
      type: DataTypes.STRING(150), 
      allowNull: false 
    },
    email: { 
      type: DataTypes.STRING(100), 
      allowNull: false, 
      unique: true, 
      validate: { isEmail: true } 
    },
    password: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    rol: { 
      type: DataTypes.STRING(20), 
      allowNull: false, 
      defaultValue: 'CLIENTE' 
    }
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: false
  }
);