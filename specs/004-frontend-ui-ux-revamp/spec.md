# Feature Specification: High-Impact Frontend UI/UX Revamp & Landing Hero

**Feature Directory**: `specs/004-frontend-ui-ux-revamp`

**Created**: 2026-07-18

**Status**: Approved

**Input**: User request: "Mejores todo el frontend: veo que al entrar a la interfaz no se llega a saber de qué trata la aplicación. Mejóralo y hazlo más llamativo usando spec kit."

---

## Executive Summary

This specification defines a comprehensive visual, structural, and UX enhancement for the CanchaYA platform frontend. It addresses the initial onboarding experience by transforming the static login view into a high-impact, modern landing experience featuring a hero banner, real-time platform statistics, interactive court discovery, a 3-step "How It Works" guide, trust indicators, and a dark glassmorphic design theme built with Google Fonts (`Outfit`) and Tailwind CSS.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Landing Hero & Clear Value Proposition (Priority: P1)

As a first-time visitor or returning user landing on `https://canchaya-production-f03a.up.railway.app`, I want to see an eye-catching hero banner that immediately explains what CanchaYA is ("Reserva tu Cancha Deportiva en Segundos"), highlights key platform statistics (+500 Reservas, 8+ Canchas, 100% Confirmación, 24/7), and provides clear Call-to-Action (CTA) buttons.

**Why this priority**: Users must instantly grasp the platform's core purpose within 3 seconds of landing on the site rather than being met with an ambiguous login prompt.

**Independent Test**: Open the web application URL in an incognito window without a token. Verify the hero section, value proposition headline, stats counter, and CTA buttons are rendered.

**Acceptance Scenarios**:
1. **Given** a new visitor, **When** they load the homepage, **Then** the system displays the hero banner with the headline "Reserva tu Cancha Deportiva en Segundos" and primary CTA "Explorar Canchas".
2. **Given** a visitor, **When** they scroll down the hero, **Then** they see live stats badges (+500 Reservas, 8+ Canchas, 100% Garantía).
3. **Given** a guest user, **When** they click "Explorar Canchas", **Then** the page smoothly scrolls to the live interactive courts catalog.

---

### User Story 2 - Guest Court Catalog & Sport Filter Bar (Priority: P1)

As an unauthenticated guest, I want to browse the active court catalog with sport filters (Todos, Fútbol, Tenis, Básquetbol, Vóley), review court characteristics (surface type, pricing per hour, sport badge), and click "Reservar Ahora" to launch account registration or sign-in.

**Why this priority**: Guests need to evaluate available sports and court pricing before deciding to register an account.

**Independent Test**: Select "Tenis" filter on the guest landing page; verify only tennis courts are displayed with their pricing and "Reservar Ahora" buttons.

**Acceptance Scenarios**:
1. **Given** the court catalog section, **When** a user clicks the "Fútbol" filter badge, **Then** only courts categorized under Fútbol are shown.
2. **Given** a court card, **When** an unauthenticated user clicks "Reservar Ahora", **Then** the system opens a modal prompting them to sign in or register to complete the booking.

---

### User Story 3 - "Cómo Funciona" & Platform Features Guide (Priority: P2)

As a user, I want to see a visual 3-step guide ("1. Explora & Filtra", "2. Elige tu Horario", "3. Confirma & Juega") and key platform guarantees (No Overbooking, Transparent Cancellation Refund Policies, Mobile Optimized) so that I feel confident using the service.

**Why this priority**: Builds user trust, explains the booking workflow clearly, and highlights competitive advantages.

**Independent Test**: Scroll to the "Cómo Funciona" section and verify the 3 visual step cards and feature guarantee badges.

**Acceptance Scenarios**:
1. **Given** a visitor on the landing page, **When** they scroll past the catalog, **Then** they see the 3-step visual guide explaining how to reserve a court.
2. **Given** a visitor, **When** reviewing the guarantees section, **Then** clear badges for cancellation policies and database-level overbooking protection are visible.

---

### User Story 4 - Modern Dark Glassmorphic Theme & Responsive Navbar (Priority: P1)

As a user across mobile and desktop devices, I want a modern dark theme (`bg-slate-950`), emerald/cyan gradient accents, smooth card hover effects, Google Fonts typography (`Outfit`), and a responsive navigation header displaying user status, login modal triggers, and quick access.

**Why this priority**: Delivers a premium, state-of-the-art aesthetic that wows users at first glance.

**Independent Test**: Inspect the navigation bar on desktop and mobile viewports; verify theme consistency, font rendering, and modal triggers.

**Acceptance Scenarios**:
1. **Given** any screen resolution, **When** the site loads, **Then** Google Font `Outfit` is rendered with sleek dark glassmorphism styling.
2. **Given** an authenticated user, **When** they look at the navbar, **Then** their name, role badge, and "Mis Reservas" / "Panel Admin" buttons are displayed with a Logout option.

---

## Edge Cases

- **Empty Catalog**: If no courts exist in the database, the catalog section shows an engaging fallback banner with an Admin "Agregar Cancha" button for admins.
- **Mobile Viewport**: Navigation menu collapses gracefully into a clean mobile header with quick login/register buttons.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a prominent Landing Hero section on the homepage with headline, subtext, stats counter, and CTA buttons.
- **FR-002**: System MUST allow guest visitors to filter court listings by sport without requiring authentication.
- **FR-003**: System MUST display a 3-step visual guide ("Cómo Funciona") and platform feature guarantees.
- **FR-004**: System MUST render modern typography using Google Fonts `Outfit` and a dark glassmorphic color scheme.
- **FR-005**: System MUST present an integrated Auth Modal for Login/Register with quick role switching (Cliente / Admin).
- **FR-006**: System MUST maintain full responsive layout support for mobile, tablet, and desktop viewports.

---

## Acceptance Criteria & Review Checklist

- [x] Feature specification file created under `specs/004-frontend-ui-ux-revamp/spec.md`.
- [x] Landing Hero section implemented in `index.html` and `app.js`.
- [x] Google Fonts `Outfit` and glassmorphic CSS tokens added to `styles.css`.
- [x] Sport filtering and guest court catalog enabled.
- [x] Auth Modal with tabs for Login and Registro.
