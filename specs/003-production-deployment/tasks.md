# Tasks: Railway Production Cloud Deployment

**Feature**: Railway Production Cloud Deployment  
**Spec**: [spec.md](file:///d:/canchaya-workspace%20-%20copia/specs/003-production-deployment/spec.md)  
**Plan**: [plan.md](file:///d:/canchaya-workspace%20-%20copia/specs/003-production-deployment/plan.md)  

---

## Phase 1: Environment & Repository Preparation

- [x] Task 1.1: Verify `railway.json` configuration file at repository root with build and start commands.
- [x] Task 1.2: Ensure server `index.js` dynamically binds to `process.env.PORT` and listens on `0.0.0.0`.
- [x] Task 1.3: Verify dynamic fallback for MySQL connection parameters in `db.js` (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`).

## Phase 2: Railway Project Setup & Database Provisioning

- [ ] Task 2.1: Create a new project in [Railway.app](https://railway.app).
- [ ] Task 2.2: Add a **Provision MySQL** service inside the Railway project.
- [ ] Task 2.3: Import schema and seed data into Railway MySQL using `canchaya-backend/schema.sql`.

## Phase 3: Web Service Deployment & Environment Variables

- [ ] Task 3.1: Connect GitHub repository `CanchaYa` to the Railway project.
- [ ] Task 3.2: Configure environment variables in Railway:
  - `PORT`: Auto-assigned by Railway
  - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
  - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
  - `DB_USER`: `${{MySQL.MYSQLUSER}}`
  - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
  - `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`
  - `JWT_SECRET`: `supersecret_canchaya_prod_key_2026`
- [ ] Task 3.3: Trigger Railway build and deploy workflow.

## Phase 4: Public Verification & Health Probes

- [ ] Task 4.1: Access the generated Railway public domain `https://<app-name>.up.railway.app/` and verify HTTP 200 OK API status response.
- [ ] Task 4.2: Verify unauthenticated guest court listing at `GET /api/canchas`.
- [ ] Task 4.3: Test client login and administrative booking workflows against the live production URL.
