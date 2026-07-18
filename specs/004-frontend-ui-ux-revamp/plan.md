# Implementation Plan: High-Impact Frontend UI/UX Revamp & Landing Hero

**Branch**: `main` | **Date**: 2026-07-18 | **Spec**: [spec.md](file:///d:/canchaya-workspace%20-%20copia/specs/004-frontend-ui-ux-revamp/spec.md)

---

## Technical Context

- **Framework**: React 18 (UMD) + Babel Standalone + Tailwind CSS CDN + Vanilla CSS Custom Tokens
- **Typography**: Google Fonts (`Outfit`, sans-serif)
- **Design Style**: Dark Glassmorphism, Emerald/Cyan Gradients, Glowing Badges, Animated Card Hovers
- **Target Files**:
  - [index.html](file:///d:/canchaya-workspace%20-%20copia/canchaya-frontend/index.html)
  - [css/styles.css](file:///d:/canchaya-workspace%20-%20copia/canchaya-frontend/css/styles.css)
  - [js/app.js](file:///d:/canchaya-workspace%20-%20copia/canchaya-frontend/js/app.js)

---

## Architecture & Layout Plan

```
┌───────────────────────────────────────────────────────────────────┐
│                      GLASSMORPHIC NAVBAR                          │
│  ⚽ CanchaYA        [Explorar] [Cómo Funciona]  (Ingresar/Perfil) │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                          HERO BANNER                              │
│         "Reserva tu Cancha Deportiva en Segundos"                │
│    La plataforma N°1 para encontrar y reservar canchas en vivo    │
│    [⚽ Ver Canchas Disponibles]   [🔑 Iniciar Sesión / Registro]   │
│                                                                   │
│  [+500 Reservas]  [8+ Canchas Premium]  [100% Online] [24/7 Support]│
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                     CATÁLOGO DE CANCHAS EN VIVO                   │
│   Filtros: [Todos] [⚽ Fútbol] [🎾 Tenis] [🏀 Básquet] [🏐 Vóley]│
│                                                                   │
│  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐   │
│  │ Camp Nou       │   │ La Bombonera   │   │ Wimbledon      │   │
│  │ S/. 60.00 / h  │   │ S/. 40.00 / h  │   │ S/. 75.00 / h  │   │
│  │ [Reservar]     │   │ [Reservar]     │   │ [Reservar]     │   │
│  └────────────────┘   └────────────────┘   └────────────────┘   │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                     ¿CÓMO FUNCIONA CANCHAYA?                      │
│   (1) Busca & Filtra   ➔   (2) Elige Horario   ➔  (3) Confirma   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Verification Plan

### Manual UI Verification
1. Open `https://canchaya-production-f03a.up.railway.app` in incognito browser.
2. Confirm Hero Banner, Google Fonts `Outfit`, Stats counter, and CTA buttons load properly.
3. Test sport filters (Fútbol, Tenis, Básquetbol, Vóley).
4. Open Auth Modal, test login and client booking.
