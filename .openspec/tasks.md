# Plan de Tareas de Implementación (Tasks Delta)

## [X] Tarea 1: Infraestructura de Persistencia (MySQL)
* [X] Diseñar e implementar el script `database/schema.sql` con llaves foráneas y el índice único contra overbooking.
* [X] Configurar el módulo de conexión del backend utilizando el driver `mysql2/promise`.

## [X] Tarea 2: Lógica del Servidor (Backend Express)
* [X] Crear la ruta de autenticación protegida por JWT.
* [X] Implementar el endpoint `POST /api/reservas/:id/cancelar` integrando la fórmula matemática de ventana horaria (<24h vs >24h).
* [X] Modificar el endpoint de analíticas para extraer las métricas agregadas directamente de MySQL mediante consultas `SUM`.

## [X] Tarea 3: Interfaz Gráfica Modular (Frontend SPA)
* [X] Acoplar el botón dinámico "Cancelar" en la vista `ReservasView.js` mapeado al id transaccional.
* [X] Actualizar las tarjetas de KPIs en `AdminDashboardView.js` consumiendo el endpoint de pérdidas y reembolsos.