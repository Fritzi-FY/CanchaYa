# Propuesta Técnica: Sistema de Gestión de Reservas "CanchaYA"

## 1. Diagnóstico del Problema y Objetivos
El complejo deportivo actual presenta ineficiencias críticas en la administración de sus canchas debido a un registro manual susceptible a errores, superposición de horarios (overbooking) y la ausencia de un canal digital centralizado para los clientes. Esto se ve agravado por la falta de un mecanismo automatizado para procesar cancelaciones y reembolsos, lo que genera pérdidas económicas directas debido a reservas fantasmas y un control de caja deficiente para los administradores.

El objetivo de este proyecto es implementar "CanchaYA", una plataforma web modular bajo el enfoque de Desarrollo Guiado por Especificaciones (SDD). Esto garantizará una trazabilidad matemática estricta entre los requisitos de negocio, las reglas funcionales y el código fuente persistido en MySQL, eliminando la inconsistencia en el desarrollo.

## 2. Alcance del Sistema (Product Backlog Unificado)
El sistema se compone de un núcleo base preexistente y una serie de incrementos (Deltas) orientados al control transaccional, la gestión de inventario de canchas y la analítica administrativa.

| ID | Rol | Historia de Usuario (Funcionalidad) | Prioridad | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **HU-01** | Cliente | Registrar una nueva cuenta con validación de correo único en MySQL. | Alta | Base (Listo) |
| **HU-02** | Cliente | Iniciar sesión de forma segura mediante JSON Web Tokens (JWT). | Alta | Base (Listo) |
| **HU-03** | Cliente | Visualizar el catálogo dinámico de canchas disponibles, sus tipos de suelo (Grass/Losa) y precios. | Alta | Base (Listo) |
| **HU-04** | Cliente | Filtrar la disponibilidad de horarios seleccionando una fecha específica en el calendario. | Alta | Base (Listo) |
| **HU-05** | Cliente | Separar un bloque horario de una cancha y simular el pago con tarjeta en la pasarela modal. | Alta | Base (Listo) |
| **HU-06** | Cliente | Visualizar la bandeja personal de "Mis Separaciones" con sus estados (Aprobado/Cancelado). | Media | Base (Listo) |
| **HU-07** | Cliente | Cancelar una reserva desde su panel y recibir un reembolso automático según la política de anticipación ($>24\text{h} = 100\%$, $<24\text{h} = 50\%$). | Alta | Delta (Por hacer) |
| **HU-08** | Admin | Autenticar el acceso exclusivo al módulo administrativo mediante roles protegidos por el servidor. | Alta | Base (Listo) |
| **HU-09** | Admin | Visualizar el Dashboard gráfico de KPIs (Ingresos brutos acumulados, reservas activas). | Media | Base (Listo) |
| **HU-10** | Admin | Monitorear el KPI de "Pérdidas por Devoluciones" e histórico de penalizaciones cobradas. | Media | Delta (Por hacer) |
| **HU-11** | Admin | Gestionar el catálogo de canchas (CRUD: Agregar nuevas canchas, editar precios de alquiler por hora o deshabilitar por mantenimiento). | Alta | Delta (Por hacer) |
| **HU-12** | Admin | Visualizar la bitácora global de reservas de todos los clientes de la plataforma para control de caja. | Alta | Delta (Por hacer) |
| **HU-13** | Sistema | Bloquear automáticamente los horarios en el calendario general una vez que una reserva ha sido pagada para evitar el doble agendamiento. | Alta | Delta (Por hacer) |

## 3. Impacto en la Arquitectura del Software
Para integrar de forma segura los nuevos módulos sin corromper el código base, se mantendrán los principios de arquitectura limpia e independiente de frameworks:

* **Persistencia (MySQL):** Se alterará la tabla `reservas` para admitir estados de cancelación (`PENDIENTE`, `PAGADO`, `CANCELADO`) y se creará una tabla `transacciones_reembolso` para auditar de forma exacta las penalidades financieras calculadas por el backend.
* **Backend (Node.js/Express):** Se expondrán nuevos endpoints controlados (`POST /api/reservas/:id/cancelar`, `GET /api/admin/metrics/losses`, `CRUD /api/admin/canchas`) validados previamente mediante esquemas estrictos de OpenSpec.
* **Frontend (Vanilla SPA):** Los módulos de UI se actualizarán dinámicamente inyectando manejadores de eventos asíncronos en las vistas de usuario y refrescando los gráficos de `Chart.js` del panel de administración sin recargar la página.