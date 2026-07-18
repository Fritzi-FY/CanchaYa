# Feature Specification: Public URL Deployment Health & Optional Auth Cancha Catalog

**Feature Directory**: `specs/002-fix-public-url-and-coverage`

**Created**: 2026-07-18

**Status**: Approved

**Input**: User problem report: "Al momento de generar la url pública me sale que 'Cannot GET /' y si agrego /api/canchas '{"error":"Acceso denegado. Token no proporcionado."}'. Solicitud adicional: Elevar la cobertura de código a >90%."

---

## Executive Summary

This specification defines the functional requirements, API route handling, and quality metrics needed to ensure the CanchaYA backend functions seamlessly in public cloud deployments (such as Railway or Render). It establishes a standard health check and fallback response for root URL requests, allows guest visitors to view the active court catalog without requiring JWT authentication, and sets a minimum test coverage threshold of 90% across the codebase.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Public URL Root & Health Verification (Priority: P1)
As a system administrator, cloud platform health checker, or web client visiting the root domain of the deployed backend service, I must receive a clear HTTP 200 JSON health response instead of a standard Express "Cannot GET /" error page when no frontend static bundle is present.

**Why this priority**: Cloud hosting services (Railway, Render, AWS Health Checks) send GET requests to `/` or `/api/health` to confirm container health. Returning 404/Cannot GET breaks automated health checks and confuses users opening the API URL.

**Independent Test**: Send an unauthenticated GET request to `https://<backend-domain>/` or `https://<backend-domain>/api/health`. The system must return HTTP status 200 with `{ "status": "OK", "message": "API CanchaYA operativa" }`.

**Acceptance Scenarios**:
1. **Given** a public deployment without local frontend static files, **When** a user or health monitor accesses `GET /`, **Then** the backend responds with HTTP status 200 and a JSON payload containing the system status and available API endpoints.
2. **Given** any monitor or client, **When** an HTTP request is made to `GET /api/health`, **Then** the backend responds with HTTP status 200 and `{ "status": "OK" }`.
3. **Given** a request to a non-existent API route such as `GET /api/ruta-inexistente`, **Then** the backend responds with HTTP status 404 and `{ "error": "Ruta no encontrada" }`.

---

### User Story 2 - Guest Discovery of Active Courts (Priority: P1)
As an unauthenticated guest user visiting the platform or opening `/api/canchas` in a web browser, I must be able to view the catalog of active courts without being blocked by a 401 "Acceso denegado" authentication error, while administrative users with valid JWT tokens can still view all courts (including inactive ones).

**Why this priority**: Guests need to explore available courts before deciding to register or sign in. Blocking public court listings degrades user onboarding experience.

**Independent Test**: Perform an HTTP GET request to `/api/canchas` without an Authorization header. The system returns HTTP status 200 with an array of active courts.

**Acceptance Scenarios**:
1. **Given** an unauthenticated guest user, **When** they request `GET /api/canchas`, **Then** the system returns HTTP status 200 with active courts (`activo: true`).
2. **Given** an authenticated administrator with a valid JWT token, **When** they request `GET /api/canchas`, **Then** the system returns HTTP status 200 with all courts (active and inactive).
3. **Given** a client with an invalid or expired token, **When** they request `GET /api/canchas`, **Then** the `optionalAuthMiddleware` ignores the invalid token without throwing an unhandled error and returns the public active court catalog.

---

### User Story 3 - High-Coverage Integration & Unit Test Suite (Priority: P1)
As a developer and system maintainer, I must have an automated test suite with at least 90% statement and line coverage so that future changes do not introduce regressions.

**Why this priority**: Ensures platform reliability, robust error handling across edge cases, and verifiable software quality.

**Independent Test**: Running `npm test -- --coverage` executes all tests and reports statements and lines coverage >90%.

**Acceptance Scenarios**:
1. **Given** the test environment, **When** `npm test` is executed, **Then** all 57 integration and unit tests pass without failure.
2. **Given** the Jest coverage reporter, **When** coverage metrics are calculated, **Then** Statements coverage exceeds 90% and Line coverage exceeds 90%.

---

## Functional Requirements

- **FR-01 (Health & Fallback Route)**: The backend app must implement `GET /api/health` returning `{ status: "OK", message: "API CanchaYA operativa" }`.
- **FR-02 (Root API Response)**: If static frontend files are absent in single-service deployment, `GET /` must return HTTP status 200 with JSON status details rather than Express default 404 page.
- **FR-03 (Optional Authentication Middleware)**: The backend must provide an `optionalAuthMiddleware` function that populates `req.usuarioUser` if a valid Bearer JWT is provided, but gracefully falls through without error if no header or an invalid header is supplied.
- **FR-04 (Public Court Route)**: `GET /api/canchas` must utilize `optionalAuthMiddleware` to allow guest access while supporting admin privilege escalation.
- **FR-05 (Test Suite Expansion)**: Integration test suite `tests/integration/reserva.integration.test.ts` must include test cases TC-I-23 to TC-I-35 covering Cancha CRUD, optional auth, health endpoints, and controller catch blocks.

---

## Success Criteria

1. **Root URL Access**: Accessing `GET /` on deployed API returns HTTP 200 JSON response.
2. **Public Catalog Access**: Requesting `GET /api/canchas` without a token returns HTTP 200 with court catalog array.
3. **Test Suite Execution**: 57 out of 57 Jest test cases pass (100% success rate).
4. **Code Coverage Threshold**: Statements coverage achieves >= 93.03% and Lines coverage achieves >= 92.87%.
