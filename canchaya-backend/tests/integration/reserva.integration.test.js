"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const database_1 = require("../../src/config/database");
const Cancha_1 = require("../../src/models/Cancha");
const Horario_1 = require("../../src/models/Horario");
const Usuario_1 = require("../../src/models/Usuario");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('Pruebas de Integración de Cobertura Máxima (>95%)', () => {
    let tokenCliente;
    let tokenAdmin;
    let canchaInstanciada;
    beforeAll(async () => {
        await database_1.sequelize.sync({ force: true });
        // 1. Crear usuarios de prueba (Cliente y Administrador)
        const passHash = await bcryptjs_1.default.hash('password123', 10);
        const cliente = await Usuario_1.Usuario.create({ nombre: 'Juan Cliente', email: 'juan@gmail.com', password: passHash, rol: 'CLIENTE' });
        const admin = await Usuario_1.Usuario.create({ nombre: 'Admin CanchaYA', email: 'admin@canchaya.com', password: passHash, rol: 'ADMIN' });
        const secret = process.env.JWT_SECRET || 'ClaveSecretaSuperSeguraParaAyacucho2026';
        // 🚀 AGREGAMOS (cliente as any) Y (admin as any) AQUÍ:
        tokenCliente = jsonwebtoken_1.default.sign({ id: cliente.id, rol: cliente.rol }, secret);
        tokenAdmin = jsonwebtoken_1.default.sign({ id: admin.id, rol: admin.rol }, secret);
        // 2. Crear Cancha y Horarios operativos
        canchaInstanciada = await Cancha_1.Cancha.create({ id: 1, nombre: 'Estadio Principal', tipo_suelo: 'Césped', precio_hora: 50.00 });
        await Horario_1.Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 0, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
        await Horario_1.Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 1, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
        await Horario_1.Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 2, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
        await Horario_1.Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 3, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
        await Horario_1.Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 4, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
        await Horario_1.Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 5, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
        await Horario_1.Horario.create({ cancha_id: canchaInstanciada.id, dia_semana: 6, hora_inicio: '06:00:00', hora_fin: '22:00:00' });
    });
    afterAll(async () => {
        await database_1.sequelize.close();
    });
    // --- FLUJO DE AUTENTICACIÓN ---
    test('TC-I-01: Debe registrar un usuario nuevo de forma exitosa (201)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({ nombre: 'Carlos Perez', email: 'carlos@gmail.com', password: 'password123' });
        expect(res.status).toBe(201);
    });
    test('TC-I-02: Debe rechazar el registro si el email ya existe (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({ nombre: 'Duplicado', email: 'juan@gmail.com', password: 'password123' });
        expect(res.status).toBe(400);
    });
    test('TC-I-03: Debe iniciar sesión exitosamente con credenciales válidas (200)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({ email: 'juan@gmail.com', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
    test('TC-I-04: Debe rechazar el login si la contraseña es incorrecta (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({ email: 'juan@gmail.com', password: 'wrongpassword' });
        expect(res.status).toBe(400);
    });
    test('TC-I-05: Debe rechazar el login si el correo electrónico no está registrado (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({ email: 'noexiste@gmail.com', password: 'password123' });
        expect(res.status).toBe(400);
    });
    // --- FLUJO DE RESERVAS ---
    test('TC-I-06: Debe rechazar la creación si no se proporciona token de autenticación (401)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/reservas').send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2026-09-20', hora_inicio: '10:00', hora_fin: '12:00' });
        expect(res.status).toBe(401);
    });
    test('TC-I-07: Debe registrar con éxito una reserva válida dentro del horario (201)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2026-09-20', hora_inicio: '10:00', hora_fin: '12:00' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });
    test('TC-I-08: Debe denegar una reserva si se cruza con otra reserva activa (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2026-09-20', hora_inicio: '11:00', hora_fin: '13:00' });
        expect(res.status).toBe(400);
    });
    test('TC-I-09: Debe rechazar reservas si la fecha ingresada pertenece al pasado (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2020-01-01', hora_inicio: '10:00', hora_fin: '12:00' });
        expect(res.status).toBe(400);
    });
    test('TC-I-10: Debe rechazar una reserva si la cancha seleccionada no existe (404)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: 999, fecha_reserva: '2026-09-21', hora_inicio: '10:00', hora_fin: '12:00' });
        expect(res.status).toBe(404);
    });
    test('TC-I-11: Debe rechazar una reserva si excede el horario operativo establecido (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/reservas').set('Authorization', `Bearer ${tokenCliente}`).send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2026-09-20', hora_inicio: '01:00', hora_fin: '04:00' });
        expect(res.status).toBe(400);
    });
    // --- SECCIÓN ROLES Y SEGURIDAD (MÁXIMO COVERAGE) ---
    test('TC-I-12: Un cliente regular debe poder listar sus propias reservas con éxito (200)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/reservas/me').set('Authorization', `Bearer ${tokenCliente}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
    // --- INYECCIÓN ESTRATÉGICA PARA COBERTURA MÁXIMA (>95%) ---
    test('TC-I-13: Debe rechazar la solicitud si el token enviado está corrupto o mal formado (401)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/reservas/me')
            .set('Authorization', 'Bearer token_completamente_falso_y_mal_formado');
        expect(res.status).toBe(401);
    });
    test('TC-I-14: Debe rechazar si la cabecera no sigue el formato Bearer (401)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/reservas/me')
            .set('Authorization', 'Basic dXN1YXJpbzpwYXNzd29yZA==');
        expect(res.status).toBe(401);
    });
    test('TC-I-15: Un administrador debe poder listar de forma global todas las reservas (200)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/reservas')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
    test('TC-I-16: Forzar el disparo de catch en AuthController mediante un payload corrupto', async () => {
        // Al enviar un tipo de dato inválido (un array en vez de string), forzamos el error interno
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/register')
            .send({ nombre: {}, email: 'error_forzado@gmail.com', password: '123' });
        expect(res.status).toBe(500);
    });
    test('TC-I-17: Debe lanzar error 500 o 401 si jwt.verify falla catastróficamente', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/reservas/me')
            .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformado');
        expect(res.status).toBe(401);
    });
    // --- NUEVOS TESTS DE INTEGRACIÓN CREADOS PARA CANCELACIONES Y CRUD CANCHAS ---
    test('TC-I-18: Debe permitir a un cliente cancelar su propia reserva (200)', async () => {
        // 1. Primero creamos una reserva activa
        const resCrear = await (0, supertest_1.default)(app_1.default)
            .post('/api/reservas')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ cancha_id: canchaInstanciada.id, fecha_reserva: '2026-09-22', hora_inicio: '14:00', hora_fin: '16:00' });
        expect(resCrear.status).toBe(201);
        const reservaId = resCrear.body.id;
        // 2. Cancelamos la reserva
        const resCancel = await (0, supertest_1.default)(app_1.default)
            .put(`/api/reservas/${reservaId}/cancelar`)
            .set('Authorization', `Bearer ${tokenCliente}`);
        expect(resCancel.status).toBe(200);
        expect(resCancel.body.estado).toBe('CANCELADO');
    });
    test('TC-I-19: Un administrador debe poder obtener el reporte de ingresos y pérdidas (200)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/reservas/reportes')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('resumen');
        expect(res.body).toHaveProperty('auditorias');
        expect(res.body.resumen).toHaveProperty('ingresosTotales');
    });
    test('TC-I-20: Un administrador debe poder crear una cancha nueva (201)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/canchas')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ nombre: 'Estadio Secundario', tipo_suelo: 'Losa', precio_hora: 40, deporte: 'BÁSQUET' });
        expect(res.status).toBe(201);
        expect(res.body.nombre).toBe('Estadio Secundario');
        expect(res.body.deporte).toBe('BÁSQUET');
    });
    test('TC-I-21: Un cliente regular NO debe poder crear una cancha (403)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/canchas')
            .set('Authorization', `Bearer ${tokenCliente}`)
            .send({ nombre: 'Estadio Intruso', tipo_suelo: 'Grass', precio_hora: 100, deporte: 'FÚTBOL' });
        expect(res.status).toBe(403);
    });
    test('TC-I-22: Un administrador debe poder desactivar una cancha (200)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .delete('/api/canchas/1')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('desactivada');
    });
});
