import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { Cancha } from '../../src/models/Cancha';
import { Horario } from '../../src/models/Horario';
import { Usuario } from '../../src/models/Usuario';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Pruebas de Integración de Cobertura Máxima (>95%)', () => {
  let tokenCliente: string;
  let tokenAdmin: string;
  let canchaInstanciada: any;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Crear usuarios de prueba (Cliente y Administrador)
    const passHash = await bcrypt.hash('password123', 10);
    const cliente = await Usuario.create({ nombre: 'Juan Cliente', email: 'juan@gmail.com', password: passHash, rol: 'CLIENTE' });
    const admin = await Usuario.create({ nombre: 'Admin CanchaYA', email: 'admin@canchaya.com', password: passHash, rol: 'ADMIN' });

    const secret = process.env.JWT_SECRET || 'ClaveSecretaSuperSeguraParaAyacucho2026';

    // 🚀 AGREGAMOS (cliente as any) Y (admin as any) AQUÍ:
    tokenCliente = jwt.sign({ id: (cliente as any).id, rol: (cliente as any).rol }, secret);
    tokenAdmin = jwt.sign({ id: (admin as any).id, rol: (admin as any).rol }, secret);

    // 2. Crear Cancha y Horarios operativos
    canchaInstanciada = await Cancha.create({ id: 1, nombre: 'Estadio Principal', tipo_suelo: 'Césped', precio_hora: 50.00 });
    await Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 0, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
    await Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 1, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
    await Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 2, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
    await Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 3, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
    await Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 4, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
    await Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 5, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
    await Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 6, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // --- FLUJO DE AUTENTICACIÓN ---
  test('TC-I-01: Debe registrar un usuario nuevo de forma exitosa (201)', async () => {
    const res = await request(app).post('/api/auth/register').send({ nombre: 'Carlos Perez', email: 'carlos@gmail.com', password: 'password123' });
    expect(res.status).toBe(201);
  });

  test('TC-I-02: Debe rechazar el registro si el email ya existe (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({ nombre: 'Duplicado', email: 'juan@gmail.com', password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('TC-I-03: Debe iniciar sesión exitosamente con credenciales válidas (200)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'juan@gmail.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('TC-I-04: Debe rechazar el login si la contraseña es incorrecta (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'juan@gmail.com', password: 'wrongpassword' });
    expect(res.status).toBe(400);
  });

  test('TC-I-05: Debe rechazar el login si el correo electrónico no está registrado (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'noexiste@gmail.com', password: 'password123' });
    expect(res.status).toBe(400);
  });

  // --- FLUJO DE RESERVAS ---
  test('TC-I-06: Debe rechazar la creación si no se proporciona token de autenticación (401)', async () => {
    const res = await request(app).post('/api/reservas').send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2026-09-20', hora_inicio: '10:00', hora_fin: '12:00' });
    expect(res.status).toBe(401);
  });

  test('TC-I-07: Debe registrar con éxito una reserva válida dentro del horario (201)', async () => {
    const res = await request(app).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2026-09-20', hora_inicio: '10:00', hora_fin: '12:00' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  test('TC-I-08: Debe denegar una reserva si se cruza con otra reserva activa (400)', async () => {
    const res = await request(app).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2026-09-20', hora_inicio: '11:00', hora_fin: '13:00' });
    expect(res.status).toBe(400);
  });

  test('TC-I-09: Debe rechazar reservas si la fecha ingresada pertenece al pasado (400)', async () => {
    const res = await request(app).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2020-01-01', hora_inicio: '10:00', hora_fin: '12:00' });
    expect(res.status).toBe(400);
  });

  test('TC-I-10: Debe rechazar una reserva si la cancha seleccionada no existe (404)', async () => {
    const res = await request(app).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: 999, fecha_reserva: '2026-09-21', hora_inicio: '10:00', hora_fin: '12:00' });
    expect(res.status).toBe(404);
  });

  test('TC-I-11: Debe rechazar una reserva si excede el horario operativo establecido (400)', async () => {
    const res = await request(app).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2026-09-20', hora_inicio: '01:00', hora_fin: '04:00' });
    expect(res.status).toBe(400);
  });

  // --- SECCIÓN ROLES Y SEGURIDAD (MÁXIMO COVERAGE) ---
  test('TC-I-12: Un cliente regular debe poder listar sus propias reservas con éxito (200)', async () => {
    const res = await request(app).get('/api/reservas/me').set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // --- INYECCIÓN ESTRATÉGICA PARA COBERTURA MÁXIMA (>95%) ---

  test('TC-I-13: Debe rechazar la solicitud si el token enviado está corrupto o mal formado (401)', async () => {
    const res = await request(app)
      .get('/api/reservas/me')
      .set('Authorization', 'Bearer token_completamente_falso_y_mal_formado');
    expect(res.status).toBe(401);
  });

  test('TC-I-14: Debe rechazar si la cabecera no sigue el formato Bearer (401)', async () => {
    const res = await request(app)
      .get('/api/reservas/me')
      .set('Authorization', 'Basic dXN1YXJpbzpwYXNzd29yZA==');
    expect(res.status).toBe(401);
  });

  test('TC-I-15: Un administrador debe poder listar de forma global todas las reservas (200)', async () => {
    const res = await request(app)
      .get('/api/reservas')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('TC-I-16: Forzar el disparo de catch en AuthController mediante un payload corrupto', async () => {
    // Al enviar un tipo de dato inválido (un array en vez de string), forzamos el error interno
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: {}, email: 'error_forzado@gmail.com', password: '123' });
    expect(res.status).toBe(500);
  });

  test('TC-I-17: Debe lanzar error 500 o 401 si jwt.verify falla catastróficamente', async () => {
    const res = await request(app)
      .get('/api/reservas/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformado');
    expect(res.status).toBe(401);
  });
});