# Tasks: CanchaYA Booking and Administration Platform

**Input**: Design documents from [specs/001-canchaya-booking-platform/](specs/001-canchaya-booking-platform/)

**Prerequisites**: plan.md, spec.md, data-model.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the backend/frontend structure and supporting tooling.

- [X] T001 Create backend and frontend project structure under backend/ and frontend/ per implementation plan
- [X] T002 Initialize Node.js project with Express, mysql2/promise, jsonwebtoken, bcryptjs, Jest, and Supertest dependencies
- [X] T003 [P] Configure environment configuration and database connection helpers for canchaya_db and canchaya_test_db

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared infrastructure that all user stories depend on.

- [X] T004 Create MySQL schema and seed scripts for clients, administrators, courts, reservations, transactions, and audit logs
- [X] T005 Implement authentication utilities for password hashing and JWT issuance/validation
- [X] T006 Implement shared middleware for request validation, RBAC, and operational-hours enforcement
- [X] T007 Create base API bootstrap with routing, error handling, and health checks
- [X] T008 Implement pure cancellation policy functions for refund/penalty calculation in backend/src/utils/
- [X] T009 Create database migration or initialization scripts that enforce the required unique constraint for reservations

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Client registration and authentication (Priority: P1) 🎯 MVP

**Goal**: Allow clients to register, sign in, and access the client experience securely.

**Independent Test**: A new client can register, sign in, and reach the client portal without any other system dependency.

### Tests for User Story 1

- [X] T010 [P] [US1] Add integration test for client registration and login in backend/tests/integration/auth.test.js
- [X] T011 [P] [US1] Add integration test for unauthorized access handling in backend/tests/integration/auth.test.js

### Implementation for User Story 1

- [X] T012 [P] [US1] Create client model and repository logic in backend/src/models/client.js
- [X] T013 [P] [US1] Implement auth service for registration and login in backend/src/services/authService.js
- [X] T014 [US1] Implement authentication routes and controllers in backend/src/api/authRoutes.js
- [X] T015 [US1] Add client-facing frontend views and forms in frontend/src/app.js and frontend/index.html

**Checkpoint**: User Story 1 should be fully functional and independently testable

---

## Phase 4: User Story 2 - Court discovery and availability filtering (Priority: P1)

**Goal**: Let clients browse courts and discover availability by date, time, and filters.

**Independent Test**: A client can search and filter courts for a target date and time and see which options are available.

### Tests for User Story 2

- [X] T016 [P] [US2] Add integration test for catalog filtering and availability in backend/tests/integration/courts.test.js

### Implementation for User Story 2

- [X] T017 [P] [US2] Create court model and repository logic in backend/src/models/court.js
- [X] T018 [US2] Implement court discovery and availability service in backend/src/services/courtService.js
- [X] T019 [US2] Implement court listing and availability endpoints in backend/src/api/courtRoutes.js
- [X] T020 [US2] Add court catalog UI and filtering controls in frontend/src/app.js and frontend/index.html

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Reservation creation and payment simulation (Priority: P1)

**Goal**: Allow clients to create bookings and persist payment simulation outcomes.

**Independent Test**: A client can create a reservation from a visible available slot and receive a deterministic transaction outcome.

### Tests for User Story 3

- [X] T021 [P] [US3] Add integration test for successful reservation creation and payment simulation in backend/tests/integration/reservations.test.js
- [X] T022 [P] [US3] Add integration test for failed payment simulation handling in backend/tests/integration/reservations.test.js

### Implementation for User Story 3

- [X] T023 [P] [US3] Create reservation and transaction models in backend/src/models/reservation.js and backend/src/models/transaction.js
- [X] T024 [US3] Implement reservation creation and payment simulation service in backend/src/services/reservationService.js
- [X] T025 [US3] Implement reservation creation API routes and controllers in backend/src/api/reservationRoutes.js
- [X] T026 [US3] Add reservation confirmation UI and payment simulation spinner in frontend/src/app.js and frontend/index.html

**Checkpoint**: User Story 3 should be independently functional

---

## Phase 6: User Story 4 - Reservation management and cancellation policy enforcement (Priority: P1)

**Goal**: Let clients view reservations, cancel eligible bookings, and receive deterministic financial outcomes.

**Independent Test**: A client can view their reservations and cancel one while receiving a calculated outcome based on the platform policy.

### Tests for User Story 4

- [X] T027 [P] [US4] Add unit test for full-refund cancellation policy in backend/tests/unit/cancellationPolicy.test.js
- [X] T028 [P] [US4] Add unit test for penalty-based cancellation policy in backend/tests/unit/cancellationPolicy.test.js
- [X] T029 [P] [US4] Add integration test for cancellation rejection for same-day or already-started reservations in backend/tests/integration/reservations.test.js

### Implementation for User Story 4

- [X] T030 [P] [US4] Create reservation management service for listing and cancelling bookings in backend/src/services/reservationService.js
- [X] T031 [US4] Implement cancellation endpoints and controllers in backend/src/api/reservationRoutes.js
- [X] T032 [US4] Add personal reservations panel UI in frontend/src/app.js and frontend/index.html

**Checkpoint**: User Story 4 should be independently functional

---

## Phase 7: User Story 5 - Administrative dashboard and monitoring access (Priority: P2)

**Goal**: Provide administrators with secure access to reporting dashboards and summary data.

**Independent Test**: An administrator can sign in and access the income and loss dashboards without using client-facing workflows.

### Tests for User Story 5

- [X] T033 [P] [US5] Add integration test for admin dashboard access in backend/tests/integration/admin.test.js

### Implementation for User Story 5

- [X] T034 [P] [US5] Create admin reporting service in backend/src/services/adminService.js
- [X] T035 [US5] Implement admin dashboard API routes in backend/src/api/adminRoutes.js
- [X] T036 [US5] Add admin dashboard UI in frontend/src/app.js and frontend/index.html

**Checkpoint**: User Story 5 should be independently functional

---

## Phase 8: User Story 6 - Court lifecycle management and transaction traceability (Priority: P2)

**Goal**: Enable administrators to create, update, deactivate courts and review global transaction history.

**Independent Test**: An administrator can create or update a court and then review the corresponding transaction log entries.

### Tests for User Story 6

- [X] T037 [P] [US6] Add integration test for court CRUD and audit logging in backend/tests/integration/admin.test.js

### Implementation for User Story 6

- [X] T038 [P] [US6] Create audit log model in backend/src/models/auditLog.js
- [X] T039 [US6] Implement court CRUD service and transaction log reporting in backend/src/services/adminService.js
- [X] T040 [US6] Implement court management and audit endpoints in backend/src/api/adminRoutes.js
- [X] T041 [US6] Add admin court management UI in frontend/src/app.js and frontend/index.html

**Checkpoint**: User Story 6 should be independently functional

---

## Phase 9: User Story 7 - Overbooking prevention and operational-hour enforcement (Priority: P1)

**Goal**: Enforce overbooking and operational-hours rules at the API boundary and persistence layer.

**Independent Test**: The system blocks an overlapping or out-of-hours reservation attempt before it becomes a confirmed booking.

### Tests for User Story 7

- [X] T042 [P] [US7] Add integration test for overbooking prevention in backend/tests/integration/reservations.test.js
- [X] T043 [P] [US7] Add integration test for out-of-hours rejection in backend/tests/integration/reservations.test.js

### Implementation for User Story 7

- [X] T044 [US7] Add database-level uniqueness enforcement and validation hooks for reservation creation in backend/src/services/reservationService.js
- [X] T045 [US7] Add reservation validation middleware and error responses for overbooking and operational hours in backend/src/middleware/
- [X] T046 [US7] Surface user-facing validation feedback in frontend/src/app.js and frontend/index.html

**Checkpoint**: User Story 7 should be independently functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improve quality, documentation, and integration across all stories.

- [X] T047 [P] Add documentation and quickstart instructions in specs/001-canchaya-booking-platform/quickstart.md
- [X] T048 [P] Add final end-to-end regression tests for booking and admin flows in backend/tests/integration/
- [X] T049 Refactor shared services and improve error messages across the application
- [X] T050 Run full test suite and validate the implementation against the spec
