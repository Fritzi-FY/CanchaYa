import { sequelize } from './config/database';
import { Usuario } from './models/Usuario';
import { Cancha } from './models/Cancha';
import { Horario } from './models/Horario';
import { Reserva } from './models/Reserva';
import { Auditoria } from './models/Auditoria';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🔄 Sincronizando base de datos de pruebas (canchaya_test_db) con force: true...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await Reserva.destroy({ where: {}, truncate: false, force: true });
    await Auditoria.destroy({ where: {}, truncate: false, force: true });
    await Horario.destroy({ where: {}, truncate: false, force: true });
    await Cancha.destroy({ where: {}, truncate: false, force: true });
    await Usuario.destroy({ where: {}, truncate: false, force: true });
    await sequelize.sync({ force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('🌱 Sembrando datos iniciales para pruebas E2E...');

    // 1. Crear usuarios
    const passHash = await bcrypt.hash('password123', 10);
    // Hash para '123456' que es la contraseña estándar del admin en el frontend
    const adminHash = await bcrypt.hash('123456', 10);

    const admin = await Usuario.create({
      id: 1,
      nombre: 'Administrador CanchaYA',
      email: 'admin@canchaya.com',
      password: adminHash,
      rol: 'ADMIN',
    });

    const cliente = await Usuario.create({
      id: 2,
      nombre: 'Juan Cliente',
      email: 'juan@gmail.com',
      password: passHash,
      rol: 'CLIENTE',
    });

    console.log(`👤 Usuarios creados: ${admin.getDataValue('email')} (ADMIN), ${cliente.getDataValue('email')} (CLIENTE)`);

    // 2. Crear canchas
    const cancha1 = await Cancha.create({
      id: 1,
      nombre: 'Camp Nou Ayacucho',
      tipo_suelo: 'GRASS',
      precio_hora: 60.00,
      deporte: 'FÚTBOL',
      activo: true,
    });

    const cancha2 = await Cancha.create({
      id: 2,
      nombre: 'La Bombonera Losa',
      tipo_suelo: 'LOSA',
      precio_hora: 40.00,
      deporte: 'FÚTBOL',
      activo: true,
    });

    const cancha3 = await Cancha.create({
      id: 3,
      nombre: 'Roland Garros Arcilla',
      tipo_suelo: 'ARCILLA',
      precio_hora: 50.00,
      deporte: 'TENIS',
      activo: true,
    });

    console.log(`🏟️ Canchas creadas: ${cancha1.getDataValue('nombre')}, ${cancha2.getDataValue('nombre')}, ${cancha3.getDataValue('nombre')}`);

    // 3. Crear horarios operativos (08:00 a 22:00) para todas las canchas (días 0-6)
    const dias = [0, 1, 2, 3, 4, 5, 6];
    for (const canchaId of [1, 2, 3]) {
      for (const dia of dias) {
        await Horario.create({
          cancha_id: canchaId,
          dia_semana: dia,
          hora_inicio: '08:00:00',
          hora_fin: '22:00:00',
        });
      }
    }

    console.log('✅ Horarios operativos creados (08:00 a 22:00).');
    console.log('🎉 Siembra de base de datos de pruebas completada.');
  } catch (error) {
    console.error('❌ Error al sembrar la base de datos de pruebas:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
