import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

const initialNodeEnv = process.env.NODE_ENV;
dotenv.config();
if (initialNodeEnv) {
  process.env.NODE_ENV = initialNodeEnv;
}

const isTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test_e2e';
const dbName = isTest ? 'canchaya_test_db' : (process.env.DB_NAME || process.env.MYSQLDATABASE || 'canchaya_db');
console.log(`🔌 Conectando a la base de datos: ${dbName} (NODE_ENV=${process.env.NODE_ENV})`);

export const sequelize = new Sequelize(
    dbName,
    process.env.DB_USER || process.env.MYSQLUSER || 'root',
    process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
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