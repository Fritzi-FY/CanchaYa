import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import reservaRoutes from './routes/reservaRoutes';
import canchaRoutes from './routes/canchaRoutes';
import { sequelize } from './config/database';

const app = express();

// Configuración de CORS dinámico
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

import fs from 'fs';

// Servir archivos estáticos del Frontend en producción o desarrollo unificado
const possibleFrontendPaths = [
  path.join(__dirname, '../public'),
  path.join(process.cwd(), 'public'),
  path.join(__dirname, '../../canchaya-frontend'),
  path.join(process.cwd(), '../canchaya-frontend')
];
const frontendPath = possibleFrontendPaths.find(p => fs.existsSync(path.join(p, 'index.html'))) || possibleFrontendPaths[0];
app.use(express.static(frontendPath));

// Inyección de Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/canchas', canchaRoutes);

// Endpoint de salud para monitoreo de despliegue
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'API CanchaYA operativa' });
});

// Ruta fallback para SPA Frontend en caso de navegación directa o respuesta API en la raíz
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      if (req.path === '/') {
        return res.status(200).json({
          status: 'OK',
          mensaje: '🚀 API CanchaYA operativa',
          endpoints: {
            health: '/api/health',
            canchas: '/api/canchas',
            auth: '/api/auth'
          }
        });
      }
      res.status(404).json({ error: `Ruta no encontrada: ${req.path}` });
    }
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ force: false }).then(async () => {
    console.log('📦 Conexión a MySQL establecida correctamente.');
    
    // Auto-poblar canchas y usuario admin si la base de datos recién se inicializa
    try {
      const { Cancha } = await import('./models/Cancha');
      const { Usuario } = await import('./models/Usuario');
      const bcrypt = await import('bcryptjs');

      const courtCount = await Cancha.count();
      if (courtCount === 0) {
        console.log('🌱 Inicializando datos semilla en la base de datos...');
        await Cancha.bulkCreate([
          { nombre: 'Camp Nou Ayacucho', tipo_suelo: 'GRASS', precio_hora: 60.00, deporte: 'FÚTBOL', activo: true },
          { nombre: 'La Bombonera Losa', tipo_suelo: 'LOSA', precio_hora: 40.00, deporte: 'FÚTBOL', activo: true },
          { nombre: 'Maracaná Sintético', tipo_suelo: 'SINTÉTICO', precio_hora: 50.00, deporte: 'FÚTBOL', activo: true },
          { nombre: 'Wembley Vóley', tipo_suelo: 'LOSA', precio_hora: 35.00, deporte: 'VÓLEY', activo: true },
          { nombre: 'Santiago Bernabéu', tipo_suelo: 'GRASS', precio_hora: 70.00, deporte: 'FÚTBOL', activo: true }
        ]);

        const { Horario } = await import('./models/Horario');
        const horariosDefault: Array<{ cancha_id: number; dia_semana: number; hora_inicio: string; hora_fin: string }> = [];
        for (let canchaId = 1; canchaId <= 5; canchaId++) {
          for (let dia = 0; dia <= 6; dia++) {
            horariosDefault.push({ cancha_id: canchaId, dia_semana: dia, hora_inicio: '08:00:00', hora_fin: '22:00:00' });
          }
        }
        await Horario.bulkCreate(horariosDefault, { ignoreDuplicates: true });

        const adminHash = await bcrypt.hash('123456', 10);
        const passHash = await bcrypt.hash('password123', 10);
        await Usuario.bulkCreate([
          { nombre: 'Administrador CanchaYA', email: 'admin@canchaya.com', password: adminHash, rol: 'ADMIN' },
          { nombre: 'Juan Cliente', email: 'juan@gmail.com', password: passHash, rol: 'CLIENTE' }
        ], { ignoreDuplicates: true });
        console.log('✅ Datos semilla y horarios operativos cargados con éxito.');
      }
    } catch (seedErr) {
      console.error('⚠️ Error al verificar/cargar datos semilla:', seedErr);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor CanchaYA corriendo en http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
  });
}

export default app;