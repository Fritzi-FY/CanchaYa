# Implementation Plan: Public URL Deployment Health & Optional Auth Cancha Catalog

**Branch**: `main` | **Date**: 2026-07-18 | **Spec**: [specs/002-fix-public-url-and-coverage/spec.md](specs/002-fix-public-url-and-coverage/spec.md)

---

## Summary

Resolve public URL deployment issues ("Cannot GET /" and mandatory token error on `/api/canchas`) by introducing a root health check handler and an `optionalAuthMiddleware`. Expand the Jest integration test suite to cover all newly introduced routes, middleware branches, and controller edge cases to achieve >90% code coverage across statements, lines, and functions.

---

## Technical Context

**Language/Version**: Node.js 20+ (TypeScript 5+ / Express 4)

**Primary Dependencies**: Express, jsonwebtoken, bcryptjs, Sequelize, Jest, Supertest

**Storage**: MySQL (`canchaya_db` for dev, `canchaya_test_db` for testing)

**Testing**: Jest + Supertest (`npm test`)

**Target Platform**: Node.js Backend REST API deployed on cloud hosting (Railway/Render/Docker)

---

## Constitution Check

- [x] **Specification-first**: Feature defined in `specs/002-fix-public-url-and-coverage/spec.md`.
- [x] **Boundary-enforced middlewares**: `optionalAuthMiddleware` handles token parsing safely at the Express route boundary.
- [x] **Pure logic & backward compatibility**: Existing protected administrative routes (`POST /api/canchas`, `PUT /api/canchas/:id`, `DELETE /api/canchas/:id`) remain strictly protected by `authMiddleware` and `roleMiddleware('ADMIN')`.
- [x] **High test coverage**: Extended test suite verifies all paths and maintains statements coverage above 90%.

---

## Proposed Changes

### Component 1: Express App & Health Endpoints

#### [MODIFY] [app.ts](file:///d:/canchaya-workspace%20-%20copia/canchaya-backend/src/app.ts)
- Add `GET /api/health` returning status 200 `{ status: "OK", message: "API CanchaYA operativa" }`.
- Update fallback route handler (`app.get('*')`) so that when no frontend `index.html` file exists (in backend-only deployment containers), requests to `GET /` return status 200 with JSON status details instead of standard Express 404 text.

---

### Component 2: Middlewares & Routes

#### [MODIFY] [authMiddleware.ts](file:///d:/canchaya-workspace%20-%20copia/canchaya-backend/src/middlewares/authMiddleware.ts)
- Implement and export `optionalAuthMiddleware(req, res, next)`.
- Extract Bearer token if present; populate `req.usuarioUser` if valid; proceed gracefully without error if token is missing or expired.

#### [MODIFY] [canchaRoutes.ts](file:///d:/canchaya-workspace%20-%20copia/canchaya-backend/src/routes/canchaRoutes.ts)
- Replace `authMiddleware` with `optionalAuthMiddleware` on `GET /api/canchas`.
- Keep `authMiddleware` and `roleMiddleware('ADMIN')` on creation, update, and deletion endpoints.

---

### Component 3: Test Suite Expansion

#### [MODIFY] [reserva.integration.test.ts](file:///d:/canchaya-workspace%20-%20copia/canchaya-backend/tests/integration/reserva.integration.test.ts)
- Add integration test cases TC-I-23 through TC-I-35 covering:
  - Unauthenticated guest court catalog listing (`GET /api/canchas`).
  - Admin court catalog listing including inactive courts.
  - Court update (`PUT /api/canchas/:id`) and 404 for non-existent IDs.
  - Court deletion (`DELETE /api/canchas/:id`) and 404 for non-existent IDs.
  - Health check (`GET /api/health`) and root status (`GET /`).
  - Invalid route handling (`GET /api/ruta-inexistente`).
  - Edge-case catch block triggers for controller methods.

---

## Verification Plan

### Automated Tests
- Run `npm test` to verify all 57 test cases pass.
- Run `npx jest --coverage` to verify statement coverage >90% and line coverage >90%.
- Run `npm run build` to verify TypeScript compilation.

### Manual Verification
- Perform an HTTP GET request to `http://localhost:3000/` and verify JSON response.
- Perform an HTTP GET request to `http://localhost:3000/api/canchas` without Authorization header and verify active courts JSON array.
