# CanchaYA Constitution

<!-- Sync Impact Report
- Version change: 1.0.0 → 1.0.0
- Modified principles: None
- Added sections: None
- Removed sections: None
- Templates requiring updates: [.specify/templates/plan-template.md] ⚠ pending, [.specify/templates/spec-template.md] ⚠ pending, [.specify/templates/tasks-template.md] ⚠ pending
- Follow-up TODOs: None
-->

## Core Principles

### I. Specification-First
All work on CanchaYA MUST begin with executable, reviewable specifications captured through the Spec Kit process. Every feature, endpoint, workflow, and business rule MUST be expressed as a verifiable contract before implementation and MUST remain traceable to the approved requirements from HU-01 through HU-13.

### II. Database-Level Guardrails
The persistence layer MUST be the authoritative enforcement point for business integrity. The overbooking rule defined in HU-13 MUST be enforced in MySQL at the database level through the unique constraint CONSTRAINT chk_horario UNIQUE (cancha_id, fecha_reserva, hora_inicio). Application code MUST NOT be accepted as the sole enforcement mechanism for this critical rule.

### III. Boundary-Enforced Middlewares
All inbound requests MUST be validated at middleware boundaries before controller execution. The operational time window from 08:00 to 22:00, role-based access control, and route segregation MUST be enforced before business logic is reached, particularly for the client and administrative flows defined in HU-08 and related requirements.

### IV. Pure Logic Isolation
All financial policies for cancellation, refund, and penalty determination from HU-07 MUST be implemented as pure, deterministic functions with no side effects. These functions MUST remain isolated from transport, database, and framework concerns so that unit tests can verify behavior without ambiguity or hidden state.

### V. Dual-Database Sandboxing
CanchaYA MUST maintain strict environment isolation through separate databases: canchaya_db for development and canchaya_test_db for testing. Test execution MUST NOT mutate development state, and development state MUST NOT affect test outcomes.

## Architectural & Tech Stack Constraints

CanchaYA MUST be implemented as a modular web platform composed of a Node.js and Express backend and a frontend SPA built with Vanilla JavaScript and Tailwind CSS. The backend MUST expose the required APIs for client experience flows from HU-03 to HU-07 and administrative operations from HU-08 to HU-12, while MySQL MUST remain the transactional persistence engine and the enforcement point for critical constraints such as overbooking.

## Quality Gates & Testing Workflow

Quality assurance for CanchaYA MUST follow a layered validation model. Unit tests MUST verify isolated business logic, especially the pure cancellation policy functions from HU-07, and integration tests MUST validate end-to-end behavior for HU-01, HU-02, HU-05, HU-11, and HU-13 using Supertest. The Spec Kit CLI MUST be used as the mandatory final validation gate before merge or release, and compliance MUST be complete before approval.

## Governance

Changes to CanchaYA MUST be introduced through pull requests and MUST NOT be approved for merge unless the relevant specifications and validation gates have passed. This constitution supersedes informal implementation practices and requires evidence-based compliance with specification, architecture, security, and testing rules before integration or release.

**Version**: 1.0.0 | **Ratified**: Julio de 2026 | **Last Amended**: Julio de 2026
