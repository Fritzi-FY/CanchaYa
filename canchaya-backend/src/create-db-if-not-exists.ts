import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;

  console.log(`🔌 Conectando a MySQL en ${host}:${port} como ${user}...`);

  const tempSequelize = new Sequelize('', user, password, {
    host,
    port,
    dialect: 'mysql',
    logging: false,
  });

  try {
    await tempSequelize.authenticate();
    console.log('✅ Conexión inicial a MySQL exitosa.');

    // Crear base de datos de desarrollo
    await tempSequelize.query('CREATE DATABASE IF NOT EXISTS `canchaya_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    console.log('📦 Base de datos "canchaya_db" verificada/creada.');

    // Crear base de datos de pruebas
    await tempSequelize.query('CREATE DATABASE IF NOT EXISTS `canchaya_test_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    console.log('📦 Base de datos "canchaya_test_db" verificada/creada.');

  } catch (error) {
    console.error('❌ Error al inicializar las bases de datos:', error);
    process.exit(1);
  } finally {
    await tempSequelize.close();
  }
}

main();
