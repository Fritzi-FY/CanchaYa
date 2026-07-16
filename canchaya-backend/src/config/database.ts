import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

export const sequelize = new Sequelize(
    isTest ? 'canchaya_test_db' : (process.env.DB_NAME || 'canchaya_db'),
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