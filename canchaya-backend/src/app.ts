import express from 'express';
import cors from 'cors'; // <-- 1. IMPORTACIÓN NUEVA
import authRoutes from './routes/authRoutes';
import reservaRoutes from './routes/reservaRoutes';
import canchaRoutes from './routes/canchaRoutes';
import { sequelize } from './config/database';

const app = express();

app.use(cors()); // <-- 2. CONFIGURACIÓN NUEVA (Permite conexiones desde el Frontend)
app.use(express.json());

// Inyección de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/canchas', canchaRoutes);

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