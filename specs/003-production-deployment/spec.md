# Feature Specification: Railway Production Cloud Deployment

**Feature Directory**: `specs/003-production-deployment`

**Created**: 2026-07-18

**Status**: Approved

**Input**: User description: "Crear la función specs/003-production-deployment usando speckit-specify, indicándome el proveedor de hosting Railway"

---

## Executive Summary

This specification defines the complete functional, technical, and operational requirements for deploying the CanchaYA platform to the **Railway** cloud hosting infrastructure (`https://railway.app`). It covers the automated container build process via `railway.json`, provisioning of the managed Railway MySQL database, environment variable management, database schema initialization (`schema.sql`), automated health checks, and verification of public HTTPS endpoints.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Railway Cloud Service Provisioning & Build Configuration (Priority: P1)

As a system administrator or software engineer, I want the CanchaYA repository to contain a production-ready Railway configuration so that connecting the GitHub repository to Railway automatically builds and deploys both the Node.js backend service and the MySQL database.

**Why this priority**: Without explicit deployment configurations (`railway.json`, environment variables, port bindings), continuous deployment to Railway will fail or encounter build/port conflicts.

**Independent Test**: Connect repository to a Railway project, trigger build, and verify that the build succeeds without error logs.

**Acceptance Scenarios**:
1. **Given** a clean repository branch, **When** Railway inspects the root directory, **Then** it detects `railway.json` and uses NIXPACKS / Node.js build configuration.
2. **Given** a Railway deployment trigger, **When** `npm install` and `npm start` execute, **Then** the container starts up cleanly without missing dependency errors.
3. **Given** a change pushed to the main branch, **When** GitHub triggers Railway, **Then** Railway executes an automated build and zero-downtime deployment.

---

### User Story 2 - Managed MySQL Database & Environment Variable Binding (Priority: P1)

As a DevOps engineer, I want the Railway backend service to securely connect to a managed Railway MySQL database instance using dynamic environment variables (`MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`), and automatically seed the database schema.

**Why this priority**: The backend requires a persistent MySQL database in cloud environments. Dynamic environment variables ensure credentials are never hardcoded in source code.

**Independent Test**: Deploy backend connected to Railway MySQL, trigger database queries, and verify table creation and data persistence.

**Acceptance Scenarios**:
1. **Given** a new Railway MySQL service, **When** environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) are linked, **Then** the Express application establishes a pool connection successfully.
2. **Given** an empty MySQL database instance, **When** `schema.sql` is executed, **Then** all required tables (`usuarios`, `canchas`, `reservas`, `transacciones`) and seed data are created.
3. **Given** a database connection drop or network blip, **When** a query is initiated, **Then** `mysql2/promise` connection pool automatically reconnects without crashing the server.

---

### User Story 3 - Public HTTPS Domain & Endpoint Health Check (Priority: P1)

As a guest user, client app, or automated health monitor, I want to access the deployed backend via Railway's public HTTPS URL (`https://<app-name>.up.railway.app`) and receive an HTTP status 200 OK health response on `GET /` and `GET /api/health`.

**Why this priority**: Cloud hosting services (Railway Health Checks) periodically poll `GET /` or `GET /api/health` to determine if the container is healthy and ready to serve traffic.

**Independent Test**: Send an unauthenticated HTTP GET request to `https://<railway-domain>/` and verify response is HTTP 200 with `{ "status": "OK", "message": "API CanchaYA operativa" }`.

**Acceptance Scenarios**:
1. **Given** the active Railway public domain, **When** a GET request is sent to `/`, **Then** the system returns HTTP status 200 and a JSON payload describing system status.
2. **Given** an unauthenticated guest user, **When** requesting `GET /api/canchas`, **Then** the system returns HTTP 200 OK with the array of active courts.
3. **Given** a request to `GET /api/health`, **Then** the backend returns `{ "status": "OK", "database": "connected" }`.

---

### User Story 4 - Production Security & JWT Token Enforcement (Priority: P2)

As a security auditor, I want all sensitive administrative routes (`POST /api/canchas`, `GET /api/dashboard/*`) to strictly enforce JWT authentication using a secure production `JWT_SECRET` stored in Railway's secrets manager.

**Why this priority**: Prevents unauthorized modifications to courts or access to financial transaction logs in production.

**Independent Test**: Attempt unauthorized access to `/api/canchas` (POST) without a token and verify HTTP 401 response.

**Acceptance Scenarios**:
1. **Given** an unauthenticated request to an administrative endpoint, **When** `POST /api/canchas` is called, **Then** the system rejects the request with HTTP 401 Unauthorized.
2. **Given** a request with a valid JWT token signed with `process.env.JWT_SECRET`, **When** sent to administrative routes, **Then** the system authorizes access.

---

## Edge Cases

- **Custom Port Binding**: Railway dynamically assigns the `PORT` environment variable at runtime. The backend MUST bind to `process.env.PORT || 3000` and `0.0.0.0`.
- **Database Cold Start**: If MySQL is starting up simultaneously with the Node container, the Node app MUST retry database connection attempts gracefully without exiting prematurely.
- **SSL / TLS Connections**: Cloud databases may require secure connection flags. The `mysql2` configuration MUST support dynamic SSL options if required by Railway.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain a valid `railway.json` file in the root directory specifying build provider (`nixpacks`), build command, and start command (`npm start`).
- **FR-002**: The server entry point MUST read `process.env.PORT` dynamically and listen on host `0.0.0.0`.
- **FR-003**: The database connection module MUST prioritize Railway MySQL environment variables (`MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`) with fallbacks to standard `DB_*` variables.
- **FR-004**: The system MUST provide an automated database setup mechanism using `canchaya-backend/schema.sql` to initialize schema and seed data on fresh deployments.
- **FR-005**: Public URL root `GET /` MUST return HTTP 200 OK with API status.
- **FR-006**: Public catalog `GET /api/canchas` MUST allow unauthenticated guest requests to browse active courts.
- **FR-007**: All CORS requests MUST be configured to allow origin credentials from the deployed frontend domain or all origins (`*`) in production API mode.
- **FR-008**: The backend MUST bundle and serve the frontend static single-page application (SPA) assets from a bundled `public/` directory or relative frontend path so that accessing the root URL `GET /` presents the full visual UI.
- **FR-009**: Operating hours validation MUST accurately compute the day of the week in local date format without UTC timezone drift, and fallback to system operational window (08:00 to 22:00) when explicit court schedule records are absent.

---

## Acceptance Criteria & Review Checklist

- [x] Feature specification file created under `specs/003-production-deployment/spec.md`.
- [x] Configuration file `railway.json` updated and validated.
- [x] Root endpoint `GET /` verified returning HTTP 200 OK.
- [x] MySQL database migration script verified (`schema.sql`).
- [x] Health check endpoint `GET /api/health` operational.
