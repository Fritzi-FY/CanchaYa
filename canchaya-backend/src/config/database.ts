import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

const initialNodeEnv = process.env.NODE_ENV;
dotenv.config();
if (initialNodeEnv) {
  process.env.NODE_ENV = initialNodeEnv;
}

const isTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test_e2e';
const dbName = isTest ? 'canchaya_test_db' : (process.env.DB_NAME || 'canchaya_db');
console.log(`🔌 Conectando a la base de datos: ${dbName} (NODE_ENV=${process.env.NODE_ENV})`);

export const sequelize = new Sequelize(
    dbName,
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);