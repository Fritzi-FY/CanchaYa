# ==========================================
# ETAPA 1: Construcción (Build Stage)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y compilar TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ==========================================
# ETAPA 2: Producción (Production Stage)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar archivos compilados desde la etapa de construcción
COPY --from=builder /app/dist ./dist
COPY schema.sql ./
COPY seed.js ./

# Exponer el puerto configurado
EXPOSE 3000

# Comando para iniciar la aplicación en producción
CMD ["node", "dist/app.js"]
