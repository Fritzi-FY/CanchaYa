# 🏟️ CanchaYA - Plataforma Inteligente de Reserva de Canchas Deportivas

> Sistema web fullstack para la reserva, gestión y administración financiera de canchas deportivas con prevención de sobrereservas (double-booking) y políticas de cancelación automatizadas.

---

## 📌 Tabla de Contenidos
- [Características Principales](#-características-principales)
- [Metodología SDD con Spec Kit](#-metodología-sdd-specification-driven-development-con-spec-kit)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Buenas Prácticas de Software](#-buenas-prácticas-de-software)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Inicialización y Siembras de Base de Datos](#-inicialización-y-siembras-de-base-de-datos)
- [Ejecución del Proyecto](#-ejecución-del-proyecto)
- [Pruebas Automatizadas E2E (Playwright)](#-pruebas-automatizadas-e2e-playwright)
- [Credenciales de Prueba](#-credenciales-de-prueba)
- [Licencia](#-licencia)

---

## 🚀 Características Principales

### 👤 Cliente / Usuario
- **Autenticación Segura:** Registro e inicio de sesión con JWT y contraseñas encriptadas (Bcrypt).
- **Catálogo Dinámico & Filtros:** Filtrado de canchas por disciplina deportiva (Fútbol, Tenis, Básquet) y verificación en tiempo real de disponibilidad.
- **Reserva e Integración de Pago Simulada:** Selección de franjas horarias (slots) con confirmación inmediata e integración de pasarela.
- **Prevención de Double-Booking (HU-13):** Bloqueo inmediato y atómico de horarios seleccionados para evitar reservas duplicadas.
- **Gestión de Reservas & Reembolsos:** Visualización de reservas activas e historial con cálculo de devoluciones automáticas por política de cancelación (>24h refund 100%).

### 🛡️ Administrador
- **Dashboard Financiero Real-Time:** Métricas de Ingresos Totales, Transacciones, Pérdidas por Reembolsos y Recaudación por Penalidades con gráficos interactivos.
- **Gestión de Canchas (CRUD):** Alta, actualización, activación y desactivación de canchas en el catálogo.
- **Bitácora de Transacciones Global (Audit Log):** Monitoreo en tiempo real de cada operación financiera y estado de reserva efectuado en el sistema.

---

## 📐 Metodología SDD (Specification-Driven Development) con Spec Kit

Este proyecto fue concebido y desarrollado utilizando la metodología **Specification-Driven Development (SDD)** guiada por **Spec Kit** (`.specify`), donde la especificación precede a la implementación y actúa como la fuente única de verdad (*Single Source of Truth*).

```
 +------------------+      +------------------+      +------------------+      +--------------------+
 |   spec.md        | ---> |   plan.md        | ---> |   data-model.md  | ---> |   tasks.md         |
 | (Historias &     |      | (Arquitectura y  |      | (Entidades y     |      | (Desglose          |
 |  Gherkin BDD)    |      |  Estrategia)     |      |  Relaciones)     |      |  Técnico)          |
 +------------------+      +------------------+      +------------------+      +--------------------+
                                                                                        |
                                                                                        v
                                                                             +--------------------+
                                                                             | Código & Pruebas   |
                                                                             | E2E en Playwright  |
                                                                             +--------------------+
```

### Artefactos del Especificación (`specs/001-canchaya-booking-platform/`):

1. **`spec.md` (Especificación Funcional y BDD):**
   - Define el *backlog* completo del sistema de la **HU-01 a la HU-13**.
   - Incluye escenarios explícitos en formato **Gherkin (Given-When-Then)** para reglas de negocio complejas como las Políticas de Cancelación (HU-07) y Prevención de Sobrereservas (HU-13).
   - Establece Criterios de Aceptación verificables e independientes.

2. **`plan.md` (Plan de Implementación Técnica):**
   - Modifica y guía la estructura técnica del proyecto, definiendo patrones de diseño, componentes frontend/backend y estrategias de integración.

3. **`data-model.md` (Modelo de Datos Relacional):**
   - Modela formalmente las entidades del dominio (`Users`, `Courts`, `Bookings`, `TransactionLogs`), sus atributos, claves primarias/foráneas y restricciones de integridad.

4. **`tasks.md` (Checklist de Tareas Ejecutables):**
   - Desglosa el desarrollo en unidades de trabajo atómicas y ordenadas por prioridad para garantizar una cobertura progresiva y trazable.

---

## 🏗️ Arquitectura del Sistema

El proyecto implementa un patrón de **Arquitectura en Capas Desacopladas (Layered / Clean Separation of Concerns)**, garantizando una clara delimitación de responsabilidades entre la presentación, la lógica de negocio y la persistencia de datos:

```
+-----------------------------------------------------------------------------------+
|                           CAPA DE PRESENTACIÓN (FRONTEND)                          |
|  SPA en HTML5 / JavaScript Vanilla / Tailwind CSS (Renderizado reactivo del DOM)  |
+-----------------------------------------------------------------------------------+
                                         |
                                   HTTP REST API
                                         v
+-----------------------------------------------------------------------------------+
|                       CAPA DE API & CONTROLADORES (BACKEND)                        |
|  Express.js Controllers / Router (Ruteo, sanitización de entrada y Auth Middleware)|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        CAPA DE LÓGICA DE NEGOCIO & SERVICIOS                      |
|  - Prevención Atómica de Double-Booking (HU-13)                                   |
|  - Motor de Reglas Financieras y Reembolsos (>24h 100% refund, <=24h penalidad)   |
|  - Generador de Bitácora e Historial de Auditoría (Audit Log)                     |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                       CAPA DE ACCESO A DATOS (DATABASES / ORM)                    |
|  Sequelize ORM (Modelos: User, Cancha, Booking, Log / Transacciones SQL)          |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                               CAPA DE PERSISTENCIA                                |
|  Base de Datos Relacional MySQL (Aislamiento entre `canchaya_db` y `canchaya_test`)|
+-----------------------------------------------------------------------------------+
```

---

## 🛡️ Buenas Prácticas de Software

En la construcción de **CanchaYA** se aplicaron estándares rigurosos de ingeniería de software:

1. **Principios SOLID:**
   - **Single Responsibility Principle (SRP):** Cada controlador y servicio backend atiende una única responsabilidad (ej. `auth.controller.ts` se encarga de tokens/hash, `booking.controller.ts` de reservas).
   - **Open/Closed Principle (OCP):** Endpoints y modelos extensibles mediante middleware modular de Express sin alterar componentes core.
   - **Dependency Inversion (DIP):** Tipado estricto en TypeScript e inyección de configuraciones de base de datos desacopladas del entorno (`NODE_ENV`).

2. **DRY (Don't Repeat Yourself) & KISS (Keep It Simple, Stupid):**
   - Reutilización de helpers centralizados para formateo de fechas, gestión de modales, alertas Toast y manejo de sesión local.
   - Frontend liviano (Vanilla JS) sin sobrecarga de frameworks innecesarios para máxima velocidad y simplicidad de mantenimiento.

3. **Seguridad y Criptografía:**
   - Hashing seguro unidireccional de contraseñas mediante `bcryptjs` con salt rounds configurables.
   - Autenticación de API basada en estándares **JSON Web Tokens (JWT)** pasados en el header `Authorization: Bearer <token>`.
   - Protección nativa contra **SQL Injection** mediante parametrización estricta en queries de Sequelize.

4. **Auditoría e Inmutabilidad (Audit Log Pattern):**
   - Cada evento financiero (reserva aprobada, cancelación, reembolso emitido, penalidad cobrada) genera automáticamente un registro inmutable en la tabla de auditoría global para transparencia administrativa.

5. **Aislamiento e Idempotencia en Pruebas:**
   - Entorno de pruebas 100% aislado impulsado por `NODE_ENV=test_e2e` usando la base de datos `canchaya_test_db`.
   - Seeder determinista (`seed-test-db.ts`) ejecutado antes de cada suite E2E con `force: true` para sincronización limpia sin contaminación de datos.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript Vanilla (ES6+ Modules), Tailwind CSS CDN.
- **Backend:** Node.js, Express.js, TypeScript, Sequelize ORM.
- **Base de Datos:** MySQL 8.0+ (Soporte para BD principal `canchaya_db` y BD de pruebas `canchaya_test_db`).
- **Testing E2E & Herramientas:** Playwright (`@playwright/test`), TypeScript, `cross-env`, `http-server`.
- **Metodología & Especificación:** Spec Kit (`.specify`) para Specification-Driven Development.

---

## 📂 Estructura del Proyecto

```
canchaya-workspace/
├── .specify/                   # Configuración y workflows del Spec Kit
├── canchaya-backend/           # Servidor REST API (TypeScript + Express + Sequelize)
│   ├── src/
│   │   ├── config/            # Configuración de base de datos MySQL por entorno
│   │   ├── controllers/       # Controladores REST HTTP
│   │   ├── models/            # Modelos Sequelize (User, Cancha, Booking, Log)
│   │   ├── routes/            # Rutas del API protegidas por JWT
│   │   ├── create-db-if-not-exists.ts
│   │   └── seed-test-db.ts    # Seeder automático e idempotente para E2E
│   ├── package.json
│   └── tsconfig.json
├── canchaya-frontend/          # Aplicación Web Frontend (SPA)
│   ├── index.html             # Estructura principal y contenedores
│   ├── app.js                 # Lógica de cliente, modales, llamadas API y componentes
│   └── styles.css             # Estilos y animaciones personalizadas
├── playwright-tests/           # Suite de Pruebas Automatizadas de Extremo a Extremo (E2E)
│   ├── admin.spec.ts          # Pruebas de métricas, CRUD de canchas y audit log
│   ├── auth.spec.ts           # Pruebas de registro, login, logout y errores
│   └── booking.spec.ts        # Pruebas de reserva, filtros, sobrebooking y reembolsos
├── specs/                      # Especificaciones del sistema (Spec Kit)
│   └── 001-canchaya-booking-platform/
│       ├── spec.md            # Historias de usuario y escenarios Gherkin BDD
│       ├── plan.md            # Plan de implementación técnica
│       ├── data-model.md      # Modelo relacional de entidades
│       └── tasks.md           # Tareas desglosadas por HU
├── package.json                # Orquestador raíz de comandos E2E y scripts
├── playwright.config.ts        # Configuración central de Playwright (Webservers, timeouts, reporter)
└── README.md                   # Documentación oficial del proyecto
```

---

## 📋 Requisitos Previos

1. **Node.js**: Versión 18.x o superior.
2. **npm**: Versión 9.x o superior.
3. **MySQL Server**: Instancia en ejecución local (`localhost:3306`) con usuario `root` y sin contraseña (o configurada en variables de entorno).

---

## ⚙️ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/canchaya.git
   cd canchaya
   ```

2. **Instalar dependencias globales y de paquetes:**
   ```bash
   # Instalar dependencias raíz (Playwright)
   npm install

   # Instalar dependencias del Backend
   cd canchaya-backend
   npm install
   cd ..
   ```

3. **Instalar navegadores de Playwright:**
   ```bash
   npx playwright install chromium
   ```

---

## 🗄️ Inicialización y Siembras de Base de Datos

El proyecto cuenta con scripts automáticos para la creación de esquemas y la siembra de datos de prueba:

```bash
# Crear bases de datos "canchaya_db" y "canchaya_test_db" si no existen
npm run db:init

# Sembrar datos iniciales para la base de datos de pruebas E2E
npm run db:seed:test
```

---

## 🖥️ Ejecución del Proyecto (Desarrollo)

Para ejecutar la aplicación localmente en modo desarrollo:

1. **Iniciar el Backend (Puerto 3000):**
   ```bash
   cd canchaya-backend
   npm run dev
   ```

2. **Iniciar el Frontend (Puerto 8080):**
   ```bash
   # En una nueva terminal, desde la raíz del proyecto:
   npx http-server canchaya-frontend -p 8080
   ```

3. Abrir en el navegador: `http://localhost:8080`

---

## 🧪 Pruebas Automatizadas E2E (Playwright)

La suite E2E automatiza todo el proceso de inicialización de BD, siembra de datos, levantamiento de servidores y ejecución de las 11 pruebas clave.

### Ejecución en Modo Headless (Línea de Comandos):
```bash
npm run test:e2e
```
*Salida esperada:*
```text
  11 passed (37.5s)
```

### Ejecución en Modo Interactivo (Playwright UI):
```bash
npm run test:e2e:ui
```

### Visualizar el Informe HTML de Resultados:
```bash
npx playwright show-report
```

---

## 🔑 Credenciales de Prueba

La base de datos se siembra automáticamente con los siguientes usuarios para pruebas:

| Rol | Correo Electrónico | Contraseña | Permisos / Alcance |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@canchaya.com` | `123456` | Acceso a Dashboard Financiero, CRUD de Canchas y Bitácora Global |
| **Cliente** | `juan@gmail.com` | `password123` | Reservas de canchas, consulta de catálogo y historial personal |

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Consulta el archivo `LICENSE` para obtener más información.
