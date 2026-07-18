# Implementation Plan: CanchaYA Booking and Administration Platform

**Branch**: `[001-canchaya-booking-platform]` | **Date**: 2026-07-14 | **Spec**: [specs/001-canchaya-booking-platform/spec.md](specs/001-canchaya-booking-platform/spec.md)

**Input**: Feature specification from [specs/001-canchaya-booking-platform/spec.md](specs/001-canchaya-booking-platform/spec.md)

## Summary

Build a modular web platform for court booking and administration using a Node.js/Express backend and a Vanilla JavaScript SPA. The implementation must support client registration and authentication, court discovery and filtering, reservation creation with simulated payment, personal reservation management, cancellation refunds/penalties, administrator dashboards and court CRUD, and full auditability. The design emphasizes database-enforced integrity, middleware validation, pure cancellation-policy logic, and strict test isolation between development and test databases.

## Technical Context

**Language/Version**: Node.js 20+ (JavaScript/ESM)

**Primary Dependencies**: Express, mysql2/promise, jsonwebtoken, bcryptjs, Jest, Supertest

**Storage**: MySQL with two databases: canchaya_db (development) and canchaya_test_db (testing)

**Testing**: Jest + Supertest for unit tests of cancellation policy logic and integration tests for HU-01, HU-02, HU-05, HU-11, and HU-13

**Target Platform**: Web application with REST API backend and SPA frontend served from the same Node/Express project

**Project Type**: Web application

**Performance Goals**: Support reservation flow completion in under 2 minutes per user action under normal load and dashboard access within 30 seconds after admin authentication

**Constraints**: Reservations must be validated at the middleware boundary; operational window is 08:00 to 22:00; RBAC is enforced for admin and client routes; cancellation policy must be implemented as pure deterministic functions; overbooking prevention must be enforced by the database through the unique constraint `CONSTRAINT chk_horario UNIQUE (cancha_id, fecha_reserva, hora_inicio)`

**Scale/Scope**: Moderate single-tenant booking platform covering client booking flows, admin operations, and audit reporting for an initial release

## Constitution Check

*GATE: Must pass before implementation.*

- [x] Specification-first: The feature is defined in [specs/001-canchaya-booking-platform/spec.md](specs/001-canchaya-booking-platform/spec.md) and remains traceable to HU-01 through HU-13.
- [x] Database-level guardrails: Overbooking prevention will be enforced in MySQL through the required unique constraint and will not rely solely on application logic.
- [x] Boundary-enforced middlewares: Request validation, operational-hours checks, and RBAC will run before controller execution.
- [x] Pure logic isolation: Refund and penalty calculation will be implemented in isolated pure functions with no side effects.
- [x] Dual-database sandboxing: Development and test execution will use separate databases so tests do not mutate development state.

**Result**: Pass. No constitutional violations require justification.

## Project Structure

```text
backend/
├── src/
│   ├── api/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   ├── models/
│   └── utils/
├── tests/
│   ├── unit/
│   └── integration/
└── package.json

frontend/
├── index.html
├── src/
│   ├── app.js
│   ├── api.js
│   └── ui.js
```

**Structure Decision**: Use a split backend/frontend layout with a Node/Express API and a lightweight SPA. The backend owns business rules, persistence, authentication, middleware, and testing. The frontend is a static Vanilla JavaScript experience with Tailwind CSS for the booking and administration UI.

## Complexity Tracking

No constitutional deviations are required for this feature. The implementation stays within the approved architecture and constraints.
