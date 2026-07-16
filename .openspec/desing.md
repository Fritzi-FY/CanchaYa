# Documento de Diseño Técnico (SDD) - CanchaYA

## 1. Decisiones de Arquitectura
El sistema adopta una arquitectura monolítica modular desacoplada, donde la capa de presentación (Frontend SPA en JavaScript Nativo) interactúa de forma asíncrona con la capa de servicios (Backend Node.js/Express) mediante el consumo de API REST. El contrato de datos es auditado y forzado en tiempo de ejecución por el motor de OpenSpec.

## 2. Modelo de Persistencia (MySQL)
Para garantizar la integridad referencial y soportar las nuevas reglas transaccionales de cancelaciones, el esquema de la base de datos se modela bajo la siguiente estructura física:

```sql
-- Estructura Maestra de Canchas
CREATE TABLE canchas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('GRASS', 'LOSA') NOT NULL,
    precio_hora DECIMAL(10,2) NOT NULL
);

-- Estructura de Usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('CLIENTE', 'ADMIN') DEFAULT 'CLIENTE'
);

-- Estructura de Reservas (Con soporte a transacciones de reembolso)
CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cancha_id INT NOT NULL,
    fecha_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    total_pago DECIMAL(10,2) NOT NULL,
    reembolso DECIMAL(10,2) DEFAULT 0.00,
    penalidad DECIMAL(10,2) DEFAULT 0.00,
    estado ENUM('APROBADO', 'CANCELADO') DEFAULT 'APROBADO',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (cancha_id) REFERENCES canchas(id),
    CONSTRAINT chk_horario UNIQUE (cancha_id, fecha_reserva, hora_inicio) -- Previene Overbooking a nivel de motor
);