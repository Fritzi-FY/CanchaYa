# Tasks: Public URL Deployment Health & Optional Auth Cancha Catalog

**Feature**: [specs/002-fix-public-url-and-coverage/spec.md](specs/002-fix-public-url-and-coverage/spec.md) | **Plan**: [specs/002-fix-public-url-and-coverage/plan.md](specs/002-fix-public-url-and-coverage/plan.md)

---

## Task List

- [x] **Task 1: Add Health & Fallback Routes in `app.ts`**
  - [x] Add `GET /api/health` endpoint returning `{ status: "OK", message: "API CanchaYA operativa" }`.
  - [x] Update fallback wildcard route `app.get('*')` to return status 200 JSON on root `/` when static frontend files are absent.

- [x] **Task 2: Implement `optionalAuthMiddleware` in `authMiddleware.ts`**
  - [x] Create `optionalAuthMiddleware` to parse optional Bearer token from headers.
  - [x] Attach decoded user payload to `req.usuarioUser` if valid; proceed without error if absent.

- [x] **Task 3: Update `canchaRoutes.ts` for Public Catalog Access**
  - [x] Apply `optionalAuthMiddleware` to `GET /api/canchas`.
  - [x] Preserve strict RBAC protection on POST, PUT, and DELETE court routes.

- [x] **Task 4: Expand Integration Test Suite in `reserva.integration.test.ts`**
  - [x] Add TC-I-23 to TC-I-35 covering court CRUD, optional auth, health endpoints, and controller catch blocks.
  - [x] Verify all 57 tests pass (`npm test`).

- [x] **Task 5: Validate High Code Coverage & Build Integrity**
  - [x] Run `npx jest --coverage` and verify statement coverage >= 93.03% and line coverage >= 92.87%.
  - [x] Run `npm run build` to ensure zero TypeScript compilation errors.
  - [x] Commit and push changes to branch `main`.
