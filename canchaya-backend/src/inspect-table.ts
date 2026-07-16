import { sequelize } from './config/database';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const [results] = await sequelize.query("DESCRIBE reservas;");
    console.log('--- RESERVAS TABLE SCHEMA ---');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

main();
