# Guía de Despliegue a Producción - CanchaYA

Este documento contiene las instrucciones detalladas para desplegar la plataforma **CanchaYA** en entornos de producción, cubriendo desde despliegues en contenedores mediante Docker hasta despliegues tradicionales y en la nube.

---

## 1. Requisitos Previos

- **Node.js**: v18.x o v20.x LTS.
- **MySQL**: Server v8.0 o superior.
- **Docker & Docker Compose**: (Opcional, pero recomendado para despliegue automatizado).

---

## 2. Opción A: Despliegue Automatizado con Docker (Recomendado)

La forma más rápida y confiable de desplegar CanchaYA es mediante Docker Compose, el cual inicializa automáticamente el servicio de base de datos MySQL y la API Node.js.

### Pasos:

1. **Clonar el repositorio**:
   ```bash
   git clone <URL_DEL_REPOSITO>
   cd canchaya-workspace
   ```

2. **Configurar las variables de entorno**:
   Copia la plantilla `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Levantar los contenedores**:
   ```bash
   docker compose up --build -d
   ```

4. **Verificar el estado de los contenedores**:
   ```bash
   docker compose ps
   ```

5. **Acceder a la aplicación**:
   - Frontend & API: `http://localhost:3000`

---

## 3. Opción B: Despliegue Tradicional (Servidor VPS / Local)

### Paso 1: Configurar la Base de Datos MySQL
1. Acceder al servidor MySQL:
   ```bash
   mysql -u root -p
   ```
2. Ejecutar el script SQL de inicialización `canchaya-backend/schema.sql`:
   ```sql
   SOURCE canchaya-backend/schema.sql;
   ```

### Paso 2: Compilar y Arrancar el Backend
1. Navegar a la carpeta del backend:
   ```bash
   cd canchaya-backend
   ```
2. Instalar dependencias:
   ```bash
   npm install --production=false
   ```
3. Configurar `.env`:
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales reales de MySQL
   ```
4. Compilar TypeScript a JavaScript:
   ```bash
   npm run build
   ```
5. Iniciar la aplicación con PM2 (Gestor de procesos de producción):
   ```bash
   npm install -g pm2
   pm2 start dist/app.js --name "canchaya-api"
   pm2 save
   pm2 startup
   ```

---

## 4. Opción C: Despliegue en la Nube (Render / Railway / Vercel)

### Despliegue en Render / Railway:
- **Servicio de Base de Datos**: Crear una instancia gestionada de MySQL 8.0 y cargar el script `schema.sql`.
- **Servicio Web (Backend)**:
  - **Build Command**: `cd canchaya-backend && npm install && npm run build`
  - **Start Command**: `cd canchaya-backend && npm start`
  - **Variables de Entorno**: Configurar `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` y `NODE_ENV=production`.

---

## 5. Mantenimiento y Respaldos

### Copias de Seguridad de la Base de Datos (Backup):
Para realizar un respaldo de la base de datos `canchaya_db`:
```bash
mysqldump -u root -p canchaya_db > backup_canchaya_$(date +%F).sql
```

### Restauración:
```bash
mysql -u root -p canchaya_db < backup_canchaya_YYYY-MM-DD.sql
```
