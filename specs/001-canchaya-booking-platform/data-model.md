# Data Model: CanchaYA Booking and Administration Platform

## Overview

This model captures the entities and relationships required to support client booking, administration, and auditability for HU-01 through HU-13. The model is designed to align with the repository constitution: critical booking integrity is enforced at the database level, financial policy is isolated in pure logic, and auditability is preserved across action changes.

## Entities

### Client

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | INT PK | AUTO_INCREMENT | Internal identifier |
| nombre | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login credential |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| rol | ENUM('client','admin') | NOT NULL | Role used for RBAC |
| created_at | DATETIME | NOT NULL | Registration timestamp |
| updated_at | DATETIME | NULL | Last update |

**Validation Rules**
- Email must be unique.
- Password must be stored as a hash.
- Role must be restricted to the supported values.

### Administrator

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | INT PK | AUTO_INCREMENT | Internal identifier |
| client_id | INT FK | NOT NULL, UNIQUE | Links to the client account used for admin access |
| created_at | DATETIME | NOT NULL | Provisioning timestamp |

**Validation Rules**
- An administrator must be backed by an authenticated user account.
- Administrative access is granted only through the role-based authorization layer.

### Court

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | INT PK | AUTO_INCREMENT | Internal identifier |
| nombre | VARCHAR(100) | NOT NULL | Public court name |
| deporte | VARCHAR(50) | NOT NULL | Sport type |
| precio_por_hora | DECIMAL(10,2) | NOT NULL | Hourly price |
| activo | BOOLEAN | NOT NULL DEFAULT TRUE | Availability for booking |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | NULL | Last update |

**Validation Rules**
- Court name and sport type must be present.
- Price must be non-negative.
- Inactive courts remain visible in history but are not bookable.

### Reservation

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | INT PK | AUTO_INCREMENT | Internal identifier |
| client_id | INT FK | NOT NULL | Owner of the reservation |
| cancha_id | INT FK | NOT NULL | Court being reserved |
| fecha_reserva | DATE | NOT NULL | Reservation date |
| hora_inicio | TIME | NOT NULL | Start time |
| duracion_horas | INT | NOT NULL | Booking duration |
| precio_total | DECIMAL(10,2) | NOT NULL | Calculated total price |
| estado | ENUM('pending','confirmed','cancelled') | NOT NULL | Reservation lifecycle state |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | NULL | Last update |

**Validation Rules**
- Reservation time must be within the operating window 08:00 to 22:00.
- The persistence layer must enforce uniqueness with `CONSTRAINT chk_horario UNIQUE (cancha_id, fecha_reserva, hora_inicio)`.
- Reservations can only be created for active courts.

### Transaction

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | INT PK | AUTO_INCREMENT | Internal identifier |
| reserva_id | INT FK | NULL | Associated reservation |
| tipo | ENUM('payment','cancellation','refund','penalty','admin_action') | NOT NULL | Event type |
| estado | ENUM('pending','accepted','rejected','completed') | NOT NULL | Transaction outcome |
| monto | DECIMAL(10,2) | NOT NULL | Monetary amount involved |
| detalle | TEXT | NULL | Human-readable summary |
| created_at | DATETIME | NOT NULL | Creation timestamp |

**Validation Rules**
- A transaction must represent a deterministic financial or operational event.
- Payment simulation outcome must be persisted even when the transaction is rejected.

### AuditLogEntry

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | INT PK | AUTO_INCREMENT | Internal identifier |
| actor_id | INT FK | NULL | User or admin who performed the action |
| accion | VARCHAR(100) | NOT NULL | Action type |
| entidad | VARCHAR(50) | NOT NULL | Target entity |
| entidad_id | INT | NULL | Target entity identifier |
| detalle | TEXT | NULL | Audit detail |
| created_at | DATETIME | NOT NULL | Immutable timestamp |

**Validation Rules**
- Audit entries are append-only and must preserve historical action history.
- Administrators and system actions should be recorded consistently.

## Relationships

- One Client can have many Reservations.
- One Court can have many Reservations.
- One Reservation can have many Transactions.
- One Client or Administrator can create many AuditLogEntry records.
- One Administrator can be associated with one Client account through the `client_id` relationship.

## State Transitions

### Reservation Lifecycle

- `pending` -> `confirmed` when payment simulation succeeds.
- `pending` -> `cancelled` when cancellation is accepted.
- `confirmed` -> `cancelled` when cancellation is accepted.
- `cancelled` is terminal.

### Payment/Financial Lifecycle

- Transaction states progress from `pending` to `accepted`, `rejected`, or `completed` depending on the operation outcome.

## Notes for Implementation

- The refund/penalty policy must be expressed as isolated pure functions, for example:
  - If the reservation starts more than 24 hours from now, return a full refund.
  - If the reservation starts within 24 hours, apply the configured penalty and return the remaining refundable amount.
  - If the reservation is already started or same-day, reject cancellation.
- The database will enforce the overbooking guardrail using the unique constraint defined in the constitution.
- The API boundary must validate operational hours and authorization before controller logic executes.
