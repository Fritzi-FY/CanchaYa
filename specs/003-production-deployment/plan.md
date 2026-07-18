# Implementation Plan: Railway Production Cloud Deployment

**Branch**: `main` | **Date**: 2026-07-18 | **Spec**: [spec.md](file:///d:/canchaya-workspace%20-%20copia/specs/003-production-deployment/spec.md)

---

## Technical Context

- **Language/Version**: Node.js v18+ / CommonJS
- **Primary Dependencies**: Express.js, MySQL2 (`mysql2/promise`), JsonWebToken, Bcryptjs, Cors, Dotenv
- **Storage**: Railway Managed MySQL Database
- **Testing**: Jest, Supertest, Playwright E2E
- **Target Platform**: Railway Cloud PaaS (`railway.app`)
- **Project Type**: Web Application (Express API + Vanilla JS/Tailwind Frontend SPA)

---

## Constitution Check

- **Specification-First**: Verified. Spec file `specs/003-production-deployment/spec.md` approved.
- **Database-Level Guardrails**: Verified. `schema.sql` includes `CONSTRAINT chk_horario UNIQUE (cancha_id, fecha_reserva, hora_inicio)` for overbooking protection.
- **Boundary-Enforced Middlewares**: Verified. Operational hours (08:00 - 22:00) and role-based authentication enforced via Express middleware.
- **Dual-Database Sandboxing**: Development and testing environments isolated via `canchaya_db` and `canchaya_test_db`.

---

## Technical Architecture & Deployment Strategy

```
                          ┌─────────────────────────────┐
                          │   Railway Cloud Platform    │
                          └──────────────┬──────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │  Railway Web Service      │                   │   Railway Managed MySQL   │
   │  (Node.js / Express API)  │ ──(mysql2/pool)──►│   Database (Port 3306)    │
   │  https://...up.railway.app│                   │   `canchaya_db`           │
   └───────────────────────────┘                   └───────────────────────────┘
```

1. **Build Provider**: Railway NIXPACKS / Node.js standard builder via `railway.json`.
2. **Port Binding**: Application binds dynamically to `process.env.PORT` on host `0.0.0.0`.
3. **Database Environment Variables**:
   - `DB_HOST` / `MYSQLHOST`
   - `DB_PORT` / `MYSQLPORT`
   - `DB_USER` / `MYSQLUSER`
   - `DB_PASSWORD` / `MYSQLPASSWORD`
   - `DB_NAME` / `MYSQLDATABASE`
   - `JWT_SECRET`
4. **Health Check Endpoint**: `/` and `/api/health` respond with HTTP 200 OK for Railway zero-downtime health probes.

---

## Verification Plan

### Automated Verification
1. Run local test suite: `npm test` (57 tests passing, >93% coverage).
2. Execute Playwright E2E tests: `npx playwright test`.

### Manual Railway Verification
1. Verify `railway.json` exists in repo root.
2. Confirm Railway public HTTPS URL returns HTTP 200 OK.
3. Validate guest court catalog endpoint `GET /api/canchas`.
