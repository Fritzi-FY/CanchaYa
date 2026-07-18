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

// Servir archivos estáticos del Frontend en producción o desarrollo unificado
const frontendPath = path.join(__dirname, '../../canchaya-frontend');
app.use(express.static(frontendPath));

// Inyección de Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/canchas', canchaRoutes);

// Ruta fallback para SPA Frontend en caso de navegación directa
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ force: false }).then(() => {
    console.log('📦 Conexión a MySQL establecida correctamente.');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor CanchaYA corriendo en http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
  });
}

export default app;