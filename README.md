# 🏟️ CanchaYA - Plataforma Inteligente de Reserva de Canchas Deportivas

[![Node.js](https://img.shields.io/badge/Node.js-v20.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.19.2-blue.svg)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-v6.37.3-blue.svg)](https://sequelize.org/)
[![MySQL](https://img.shields.io/badge/MySQL-v8.0-orange.svg)](https://www.mysql.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-green.svg)](https://playwright.dev/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **CanchaYA** es una plataforma web fullstack empresarial para la reserva, gestión operativa y administración financiera de canchas deportivas. Diseñada con prevención atómica de sobrereservas (*double-booking*), cálculo automatizado de políticas de cancelación/reembolsos y bitácora inmutable de auditoría financiera.

---

## 📌 Tabla de Contenidos
1. [🚀 Características Principales](#-características-principales)
2. [📐 Metodología SDD (Specification-Driven Development) con Spec Kit](#-metodología-sdd-specification-driven-development-con-spec-kit)
3. [🏗️ Arquitectura del Sistema](#-arquitectura-del-sistema)
4. [🛡️ Buenas Prácticas de Software y Principios SOLID](#-buenas-prácticas-de-software-y-principios-solid)
5. [🛠️ Tecnologías y Librerías Utilizadas](#-tecnologías-y-librerías-utilizadas)
6. [📂 Estructura Completa del Proyecto](#-estructura-completa-del-proyecto)
7. [📋 Requisitos Previos](#-requisitos-previos)
8. [⚙️ Instalación y Configuración Paso a Paso](#️-instalación-y-configuración-paso-a-paso)
9. [🗄️ Inicialización y Siembras de Base de Datos](#️-inicialización-y-siembras-de-base-de-datos)
10. [🖥️ Ejecución del Proyecto (Desarrollo y Servidor Integrado)](#-ejecución-del-proyecto-desarrollo-y-servidor-integrado)
11. [🐳 Despliegue con Docker y Docker Compose](#-despliegue-con-docker-y-docker-compose)
12. [☁️ Despliegue en la Nube (Railway / Cloud PaaS)](#-despliegue-en-la-nube-railway--cloud-paas)
13. [🔌 Especificación Completa de la API REST](#-especificación-completa-de-la-api-rest)
14. [🧪 Suite de Pruebas Automatizadas E2E (Playwright)](#-suite-de-pruebas-automatizadas-e2e-playwright)
15. [🔑 Credenciales y Entorno de Pruebas](#-credenciales-y-entorno-de-pruebas)
16. [📚 Documentación Adicional en `/docs`](#-documentación-adicional-en-docs)
17. [📄 Licencia](#-licencia)

---

## 🚀 Características Principales

### 👤 Módulo Cliente / Usuario
- **🔐 Autenticación y Registro de Usuarios (HU-01):** Registro público e inicio de sesión seguro mediante JSON Web Tokens (JWT) y encriptación de contraseñas con `bcryptjs`.
- **⚽ Catálogo Dinámico & Filtros Multidisciplina (HU-02):** Búsqueda y filtrado instantáneo por disciplina deportiva (*Fútbol, Tenis, Básquet, Pádel*), tipo de suelo (*Sintético, Cemento, Parquet*) y precio por hora.
- **📅 Horarios y Disponibilidad en Tiempo Real (HU-03):** Consulta interactiva de franjas horarias (*slots*) libres por fecha seleccionada.
- **💳 Reserva e Integración de Pago Simulada (HU-04):** Proceso fluido de selección de slot con simulación de pasarela de pagos integrada (*tarjeta de crédito/débito*), generación de comprobante y estado de pago en tiempo real.
- **🔒 Prevención Atómica de Double-Booking (HU-05 / HU-13):** Bloqueo transaccional de slots a nivel de base de datos para garantizar que ningún horario sea reservado simultáneamente por dos usuarios.
- **📋 Gestión de Reservas Personales & Cancelación (HU-06 / HU-07):** Panel personal para consultar reservas activas e históricas con opción de cancelación y evaluación automática de reembolso:
  - **Cancelación con > 24 horas de anticipación:** Reembolso automático del **100%** del monto pagado.
  - **Cancelación con ≤ 24 horas de anticipación:** Reembolso del **0%** (retención por penalidad por cancelación tardía).

### 🛡️ Módulo Administrador
- **📊 Dashboard Financiero Real-Time (HU-08):** Panel ejecutivo con tarjetas de resumen métrico y gráficos financieros interactivos:
  - **Ingresos Totales Brutos** acumulados por reservas aprobadas.
  - **Total de Transacciones** efectuadas en el sistema.
  - **Pérdidas por Reembolsos** devueltos a clientes.
  - **Recaudación por Penalidades** retenidas por cancelaciones tardías.
- **🏟️ Gestión Integral de Canchas - CRUD (HU-09):** Creación, edición de tarifas/nombres, activación y desactivación de instalaciones deportivas en el catálogo.
- **📜 Bitácora Global de Transacciones / Audit Log (HU-10):** Historial inmutable de auditoría donde se registran cronológicamente todas las operaciones financieras (*Reservas, Cancelaciones, Reembolsos, Penalidades*) con ID de usuario, monto, fecha y tipo de evento.
- **🛠️ Control de Estado y Disponibilidad (HU-11 / HU-12):** Gestión centralizada de permisos protegidos por middleware de rol `ADMIN`.

---

## 📐 Metodología SDD (Specification-Driven Development) con Spec Kit

Este proyecto fue desarrollado bajo la metodología **Specification-Driven Development (SDD)** con la herramienta **Spec Kit** (`.specify`), garantizando que cada línea de código responda directamente a una especificación técnica o historia de usuario verificable.

```
 +-----------------------------------+
 |   specs/001-canchaya-booking/     |
 |   ├── spec.md (BDD Gherkin)       |
 +-----------------------------------+
                   |
                   v
 +-----------------------------------+
 |   plan.md (Plan Arquitectura)     |
 +-----------------------------------+
                   |
                   v
 +-----------------------------------+
 |   data-model.md (Modelo SQL/ORM)  |
 +-----------------------------------+
                   |
                   v
 +-----------------------------------+
 |   tasks.md (Matriz de Tareas)     |
 +-----------------------------------+
                   |
                   v
 +-----------------------------------+
 |   Código TypeScript & Playwright  |
 +-----------------------------------+
```

### Artefactos Principales de Especificación:
* **`specs/001-canchaya-booking-platform/spec.md`**: Define el backlog funcional completo de la **HU-01 a la HU-13** con criterios de aceptación explícitos y escenarios **Gherkin BDD** (*Given-When-Then*).
* **`specs/001-canchaya-booking-platform/plan.md`**: Define los patrones de arquitectura, middleware de seguridad, estrategia de ruteo y diseño modular.
* **`specs/001-canchaya-booking-platform/data-model.md`**: Define el esquema de base de datos relacional, modelos de Sequelize (`Usuario`, `Cancha`, `Horario`, `Reserva`, `Auditoria`), claves foráneas y restricciones `UNIQUE`.
* **`specs/001-canchaya-booking-platform/tasks.md`**: Desglose paso a paso de las tareas de desarrollo para implementación trazable.

---

## 🏗️ Arquitectura del Sistema

CanchaYA adopta una **Arquitectura en Capas Desacopladas (Layered Architecture)** con separación estricta de responsabilidades:

```
+---------------------------------------------------------------------------------------+
|                          CAPA DE PRESENTACIÓN (FRONTEND)                              |
|  Single Page Application (SPA) en HTML5 / JavaScript ES6+ / Tailwind CSS             |
|  Modales interactivos, gráficos de métricas y renderizado reactivo del DOM             |
+---------------------------------------------------------------------------------------+
                                           |
                                     HTTP REST API
                                           v
+---------------------------------------------------------------------------------------+
|                      CAPA DE API & CONTROLADORES (BACKEND)                            |
|  Express.js Routers (`authRoutes`, `canchaRoutes`, `reservaRoutes`)                  |
|  Middlewares de Auth JWT (`authMiddleware`) y Autorización Admin (`adminMiddleware`) |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                      CAPA DE LÓGICA DE NEGOCIO & SERVICIOS                            |
|  - Verificación y Bloqueo Atómico de Double-Booking (HU-13)                           |
|  - Cálculo de Políticas de Reembolso (>24h: 100% refund | <=24h: 0% refund)             |
|  - Auditoría Financiera Inmutable (Bitácora Auditoria)                                |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                       CAPA DE ACCESO A DATOS (ORM / SEQUELIZE)                        |
|  Modelos: `Usuario`, `Cancha`, `Horario`, `Reserva`, `Auditoria`                     |
|  Conexión Sequelize con Pool de Conexiones Mysql2                                     |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                         CAPA DE PERSISTENCIA (DATABASE)                               |
|  Base de Datos Relacional MySQL 8.0                                                   |
|  (Aislamiento entre `canchaya_db` para Producción/Dev y `canchaya_test_db` para E2E)   |
+---------------------------------------------------------------------------------------+
```

---

## 🛡️ Buenas Prácticas de Software y Principios SOLID

El código fuente de CanchaYA sigue estándares de ingeniería de software de alta calidad:

1. **Principios SOLID:**
   - **Single Responsibility Principle (SRP):** Cada controlador (`authController`, `canchaController`, `reservaController`) atiende exclusivamente un dominio funcional.
   - **Open/Closed Principle (OCP):** El sistema permite extender tipos de deportes o agregar nuevos roles sin modificar la lógica base de reservas.
   - **Liskov Substitution Principle (LSP):** Modelos ORM coherentes que extienden `Model` de Sequelize.
   - **Interface Segregation Principle (ISP):** Interfaces TypeScript independientes para cada entidad del sistema.
   - **Dependency Inversion Principle (DIP):** Modulos desacoplados dependientes de abstracciones (ORM y configuraciones de entorno centralizadas).

2. **Seguridad y Criptografía:**
   - Hashing seguro unidireccional de contraseñas con **Bcrypt** (`bcryptjs`).
   - Autenticación sin estado (*stateless*) mediante tokens **JWT** transmitidos mediante la cabecera `Authorization: Bearer <token>`.
   - Protección nativa contra inyecciones SQL mediante consultas parametrizadas a través de Sequelize ORM.
   - Habilitación de CORS configurable mediante variables de entorno.

3. **Aislamiento de Entornos e Idempotencia:**
   - Entorno de pruebas 100% independiente alimentado por `NODE_ENV=test_e2e` y base de datos `canchaya_test_db`.
   - Script de siembra idéntico e idempotente (`seed-test-db.ts`) ejecutado antes de las pruebas E2E para garantizar la repetibilidad de los tests.

---

## 🛠️ Tecnologías y Librerías Utilizadas

| Capa / Dominio | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript Vanilla (ES6 Modules) | Interfaz de usuario SPA responsiva y ligera |
| **Diseño / UI** | Tailwind CSS CDN | Framework de utilidades CSS para diseño moderno |
| **Backend Framework** | Node.js (v20+), Express.js | Runtime de JavaScript y servidor web RESTful |
| **Lenguaje Backend** | TypeScript | Tipado estático y compilación a JavaScript ES2020 |
| **ORM / Persistencia** | Sequelize ORM, mysql2 | Mapeo objeto-relacional y drivers de MySQL |
| **Base de Datos** | MySQL Server 8.0 | Base de datos relacional transaccional |
| **Seguridad** | jsonwebtoken, bcryptjs, cors | Autenticación JWT, hashing de claves y CORS |
| **Pruebas E2E** | Playwright (@playwright/test) | Framework para pruebas end-to-end de navegadores |
| **Contenedores** | Docker, Docker Compose | Containerización multi-servicio de app y base de datos |
| **Despliegue PaaS** | Railway / Nixpacks | Plataforma de hosting en la nube |
| **Metodología** | Spec Kit (`.specify`) | Specification-Driven Development (SDD) |

---

## 📂 Estructura Completa del Proyecto

```
canchaya-workspace/
├── .agents/                    # Reglas y habilidades personalizadas del agente
├── .dockerignore               # Archivos excluidos del build de Docker
├── .env.example                # Plantilla de variables de entorno globales
├── .gitignore                  # Archivos ignorados por Git
├── .specify/                   # Configuración y workflows de Spec Kit
├── README.md                   # Documentación principal del proyecto
├── docker-compose.yml          # Orquestación de servicios (MySQL + Node App)
├── package.json                # Script runner raíz de pruebas E2E y comandos globales
├── playwright.config.ts        # Configuración central de Playwright (puertos, timeouts, reportes)
├── railway.json                # Configuración de despliegue automatizado en Railway
│
├── canchaya-backend/           # Servidor API Backend REST (TypeScript + Express + Sequelize)
│   ├── Dockerfile              # Build multi-stage para Node.js 20 Alpine
│   ├── package.json            # Dependencias del servidor Node.js
│   ├── schema.sql              # Script DDL oficial de creación de base de datos MySQL
│   ├── tsconfig.json           # Configuración del compilador de TypeScript
│   └── src/
│       ├── app.ts              # Punto de entrada de la aplicación Express y static server
│       ├── config/
│       │   └── database.ts     # Configuración de Sequelize y pools MySQL por entorno
│       ├── controllers/
│       │   ├── authController.ts    # Registro, Login y validación de tokens
│       │   ├── canchaController.ts  # CRUD y estado de canchas deportivas
│       │   └── reservaController.ts # Reservas, sobrebooking, cancelaciones y métricas
│       ├── middlewares/
│       │   ├── adminMiddleware.ts  # Validación de rol ADMINISTRADOR
│       │   └── authMiddleware.ts   # Validación y decodificación de tokens JWT
│       ├── models/
│       │   ├── Auditoria.ts    # Modelo de logs de auditoría financiera
│       │   ├── Cancha.ts       # Modelo de canchas deportivas
│       │   ├── Horario.ts      # Modelo de franjas horarias / slots
│       │   ├── Reserva.ts      # Modelo de reservas y estados
│       │   └── Usuario.ts      # Modelo de usuarios y credenciales
│       ├── routes/
│       │   ├── authRoutes.ts   # Rutas `/api/auth`
│       │   ├── canchaRoutes.ts # Rutas `/api/canchas`
│       │   └── reservaRoutes.ts# Rutas `/api/reservas`
│       ├── create-db-if-not-exists.ts # Script de auto-creación de esquemas DB
│       └── seed-test-db.ts     # Seeder idempotente de datos iniciales para E2E
│
├── canchaya-frontend/          # Aplicación Web Frontend SPA
│   ├── index.html              # Maquetación principal HTML5 y contenedores dinámicos
│   ├── js/
│   │   └── app.js              # Lógica de cliente, consumo API REST, modales y renderizado
│   └── css/ (o styles.css)     # Estilos y animaciones personalizadas
│
├── docs/                       # Documentación Técnica Detallada
│   ├── API_DOCUMENTATION.md    # Especificación completa de endpoints REST
│   ├── ARQUITECTURA_Y_BASE_DE_DATOS.md # Diagramas ER y arquitectura técnica
│   ├── DEPLOYMENT.md           # Guía completa de despliegue en VPS, Docker y Railway
│   ├── MANUAL_USUARIO_Y_ADMIN.md   # Guía paso a paso para Clientes y Administradores
│   └── SPEC_KIT_VERIFICATION.md    # Matriz de trazabilidad de requisitos HU-01 a HU-13
│
├── playwright-tests/           # Suite de Pruebas Automatizadas E2E
│   ├── admin.spec.ts           # Tests E2E de Métricas, CRUD Canchas y Audit Log
│   ├── auth.spec.ts            # Tests E2E de Registro, Login, Logout y errores
│   └── booking.spec.ts         # Tests E2E de Reservas, Filtros, Double-booking y Cancelación
│
└── specs/                      # Especificaciones del Proyecto (Spec Kit)
    └── 001-canchaya-booking-platform/
        ├── spec.md             # Historias de Usuario HU-01 a HU-13 con BDD Gherkin
        ├── plan.md             # Plan técnico de implementación
        ├── data-model.md       # Modelo de entidades y datos
        └── tasks.md            # Checklist de tareas de desarrollo
```

---

## 📋 Requisitos Previos

Asegúrate de contar con los siguientes elementos instalados en tu sistema:

1. **Node.js**: Versión `18.x` o `20.x` LTS.
2. **npm**: Versión `9.x` o superior.
3. **MySQL Server**: Instancia en ejecución local en el puerto `3306` (o vía Docker en el puerto `3307`).
4. **Git**: Para clonación y control de versiones.

---

## ⚙️ Instalación y Configuración Paso a Paso

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/canchaya.git
cd canchaya-workspace
```

### 2. Configurar las variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en la plantilla `.env.example`:
```bash
cp .env.example .env
```

Contenido del archivo `.env`:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=canchaya_db
JWT_SECRET=ClaveSecretaSuperSeguraParaAyacucho2026Produccion
CORS_ORIGIN=*
```

### 3. Instalar dependencias
```bash
# 1. Instalar dependencias del orquestador raíz (Playwright)
npm install

# 2. Instalar dependencias del servidor Backend
cd canchaya-backend
npm install
cd ..
```

---

## 🗄️ Inicialización y Siembras de Base de Datos

El sistema incluye comandos automatizados para la creación de la base de datos y la siembra de datos de prueba.

### 1. Crear la Base de Datos (`canchaya_db` y `canchaya_test_db`):
```bash
npm run db:init
```
*Este comando ejecuta la comprobación de esquemas y crea las bases de datos si no existen.*

### 2. Sembrar Datos Iniciales de Prueba:
```bash
npm run db:seed:test
```
*Crea la estructura de tablas y puebla automáticamente los usuarios (`admin@canchaya.com`, `juan@gmail.com`), canchas por defecto y horarios iniciales.*

---

## 🖥️ Ejecución del Proyecto (Desarrollo y Servidor Integrado)

### Opción A: Servidor Integrado Monolítico (Recomendado)
El backend de CanchaYA está configurado para servir los archivos estáticos del frontend directamente desde la ruta raíz `http://localhost:3000`.

```bash
cd canchaya-backend
npm run dev
```
Accede en tu navegador a: `http://localhost:3000`

### Opción B: Ejecución Desacoplada (Backend + Frontend HTTP Server)
Si deseas ejecutar la API y el Frontend en servidores independientes:

1. **Iniciar el Backend REST API (Puerto 3000):**
   ```bash
   cd canchaya-backend
   npm run dev
   ```

2. **Iniciar el Frontend Web Server (Puerto 8080):**
   ```bash
   # En una nueva ventana de terminal desde la raíz del proyecto:
   npx http-server canchaya-frontend -p 8080
   ```
   Accede en tu navegador a: `http://localhost:8080`

---

## 🐳 Despliegue con Docker y Docker Compose

El proyecto incluye un entorno containerizado listo para producción mediante Docker Compose.

### Comandos de Docker:

1. **Construir e Iniciar Contenedores en Segundo Plano:**
   ```bash
   npm run docker:up
   # O directamente:
   docker compose up --build -d
   ```

2. **Verificar el Estado de los Contenedores:**
   ```bash
   docker compose ps
   ```

3. **Ver Logs del Backend o Base de Datos:**
   ```bash
   docker compose logs -f backend
   ```

4. **Detener y Limpiar Contenedores:**
   ```bash
   npm run docker:down
   # O directamente:
   docker compose down
   ```

---

## ☁️ Despliegue en la Nube (Railway / Cloud PaaS)

El proyecto está preparado con `railway.json` para despliegue continuo (*Continuous Deployment*) en la nube:

1. Conecta el repositorio GitHub a tu proyecto en **Railway.app**.
2. Agrega un servicio de **MySQL Database** en Railway.
3. En el servicio de aplicación Node.js, configura las siguientes Variables de Entorno:
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
   - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
   - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
   - `DB_USER`: `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   - `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`
   - `JWT_SECRET`: `<Tu_Clave_Secreta_JWT>`
4. Railway detectará la configuración `railway.json` y compilará la aplicación automáticamente.

---

## 🔌 Especificación Completa de la API REST

### 🔑 1. Autenticación (`/api/auth`)

#### 1.1 Registrar Usuario
- **Endpoint:** `POST /api/auth/register`
- **Body Request:**
  ```json
  {
    "nombre": "Carlos Mendoza",
    "email": "carlos@gmail.com",
    "password": "password123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 3,
    "nombre": "Carlos Mendoza",
    "email": "carlos@gmail.com",
    "rol": "CLIENTE"
  }
  ```

#### 1.2 Iniciar Sesión
- **Endpoint:** `POST /api/auth/login`
- **Body Request:**
  ```json
  {
    "email": "juan@gmail.com",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Login exitoso",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 2,
      "nombre": "Juan Pérez",
      "email": "juan@gmail.com",
      "rol": "CLIENTE"
    }
  }
  ```

---

### 🏟️ 2. Canchas (`/api/canchas`)

#### 2.1 Listar Canchas Activas
- **Endpoint:** `GET /api/canchas`
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "nombre": "Cancha El Maracaná",
      "tipo_suelo": "SINTETICO",
      "precio_hora": "60.00",
      "activo": true
    }
  ]
  ```

#### 2.2 Crear Nueva Cancha (Requiere Admin)
- **Endpoint:** `POST /api/canchas`
- **Headers:** `Authorization: Bearer <TOKEN_ADMIN>`
- **Body Request:**
  ```json
  {
    "nombre": "Cancha Roland Garros",
    "tipo_suelo": "ARCILLA",
    "precio_hora": 80.00
  }
  ```

#### 2.3 Cambiar Estado de Cancha (Activar/Desactivar)
- **Endpoint:** `PATCH /api/canchas/:id/estado`
- **Headers:** `Authorization: Bearer <TOKEN_ADMIN>`
- **Body Request:** `{ "activo": false }`

---

### 📅 3. Reservas (`/api/reservas`)

#### 3.1 Crear Reserva (Prevención Double-Booking)
- **Endpoint:** `POST /api/reservas`
- **Headers:** `Authorization: Bearer <TOKEN_CLIENTE>`
- **Body Request:**
  ```json
  {
    "cancha_id": 1,
    "fecha_reserva": "2026-08-20",
    "hora_inicio": "16:00",
    "hora_fin": "17:00"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 12,
    "cancha_id": 1,
    "usuario_id": 2,
    "fecha_reserva": "2026-08-20",
    "hora_inicio": "16:00:00",
    "hora_fin": "17:00:00",
    "total_pago": 60.00,
    "estado": "APROBADO"
  }
  ```

#### 3.2 Listar Reservas del Usuario
- **Endpoint:** `GET /api/reservas/mis-reservas`
- **Headers:** `Authorization: Bearer <TOKEN_CLIENTE>`

#### 3.3 Cancelar Reserva (Política de Reembolso Automático)
- **Endpoint:** `POST /api/reservas/:id/cancelar`
- **Headers:** `Authorization: Bearer <TOKEN_CLIENTE>`
- **Response (200 OK):**
  ```json
  {
    "message": "Reserva cancelada exitosamente",
    "reembolso": 60.00,
    "penalidad": 0.00,
    "porcentajeReembolso": "100%"
  }
  ```

#### 3.4 Reporte Financiero & Auditoría (Requiere Admin)
- **Endpoint:** `GET /api/reservas/admin/reporte`
- **Headers:** `Authorization: Bearer <TOKEN_ADMIN>`
- **Response (200 OK):**
  ```json
  {
    "ingresosTotales": 480.00,
    "perdidasReembolso": 60.00,
    "recaudacionPenalidades": 50.00,
    "totalTransacciones": 10,
    "reservasAprobadas": 8,
    "reservasCanceladas": 2
  }
  ```

---

## 🧪 Suite de Pruebas Automatizadas E2E (Playwright)

El proyecto cuenta con una suite completa de pruebas End-to-End en Playwright que automatiza la verificación de todas las historias de usuario de la **HU-01 a la HU-13**.

```
  11 passed (37.5s)
```

### Ejecutar Pruebas en Modo Headless:
```bash
npm run test:e2e
```

### Ejecutar Pruebas en Modo Interactivo (UI Mode):
```bash
npm run test:e2e:ui
```

### Generar y Abrir Reporte de Cobertura HTML:
```bash
npx playwright show-report
```

### Cobertura de las Pruebas E2E (`playwright-tests/`):
- **`auth.spec.ts`**: Verificación de flujo completo de registro de nuevos usuarios, validación de credenciales incorrectas, inicio de sesión exitoso, persistencia de token JWT y cierre de sesión.
- **`booking.spec.ts`**: Verificación de catálogo de canchas, selección de fechas, prevención atómica de double-booking (HU-13), flujo de pago simulado, consulta de reservas activas y prueba de cancelación con reembolso automático.
- **`admin.spec.ts`**: Verificación de acceso restringido a administradores, visualización de métricas en el Dashboard Financiero, creación de nuevas canchas, desactivación de instalaciones y auditoría global de bitácora.

---

## 🔑 Credenciales y Entorno de Pruebas

Tras ejecutar `npm run db:seed:test`, la base de datos se poblará automáticamente con los siguientes usuarios de prueba preconfigurados:

| Rol | Correo Electrónico | Contraseña | Alcance y Permisos |
| :--- | :--- | :--- | :--- |
| 🛡️ **Administrador** | `admin@canchaya.com` | `123456` | Dashboard financiero, CRUD de canchas y Bitácora Global |
| 👤 **Cliente de Prueba** | `juan@gmail.com` | `password123` | Reservas de canchas, consulta de catálogo e historial personal |

---

## 📚 Documentación Adicional en `/docs`

Para obtener detalles técnicos profundos, consulta los documentos especializados incluidos en la carpeta [`/docs`](file:///d:/canchaya-workspace%20-%20copia/docs):

- 📖 [**API_DOCUMENTATION.md**](file:///d:/canchaya-workspace%20-%20copia/docs/API_DOCUMENTATION.md): Especificación exhaustiva de endpoints, parámetros y respuestas JSON.
- 🏗️ [**ARQUITECTURA_Y_BASE_DE_DATOS.md**](file:///d:/canchaya-workspace%20-%20copia/docs/ARQUITECTURA_Y_BASE_DE_DATOS.md): Esquema DDL SQL, diagrama ER y diseño de modelos de Sequelize.
- 🚀 [**DEPLOYMENT.md**](file:///d:/canchaya-workspace%20-%20copia/docs/DEPLOYMENT.md): Guía paso a paso para desplegar en Docker, VPS Linux, PM2 y plataformas Cloud.
- 👤 [**MANUAL_USUARIO_Y_ADMIN.md**](file:///d:/canchaya-workspace%20-%20copia/docs/MANUAL_USUARIO_Y_ADMIN.md): Manual operativo de usuario para clientes y administradores.
- ✅ [**SPEC_KIT_VERIFICATION.md**](file:///d:/canchaya-workspace%20-%20copia/docs/SPEC_KIT_VERIFICATION.md): Matriz de verificación y trazabilidad de requisitos Spec Kit.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

<p align="center">
  Hecho con ❤️ para la gestión inteligente de escenarios deportivos.
</p>
