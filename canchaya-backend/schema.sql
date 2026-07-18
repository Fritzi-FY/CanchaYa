-- Script para configurar las bases de datos de CanchaYA (canchaya_db y canchaya_test_db)

-- ==========================================
-- 1. BASE DE DATOS DE PRUEBAS (canchaya_test_db)
-- ==========================================
CREATE DATABASE IF NOT EXISTS `canchaya_test_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- 2. BASE DE DATOS DE DESARROLLO/PRODUCCIÓN (canchaya_db)
-- ==========================================
CREATE DATABASE IF NOT EXISTS `canchaya_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `canchaya_db`;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(20) NOT NULL DEFAULT 'CLIENTE'
) ENGINE=InnoDB;

-- Tabla de Canchas
CREATE TABLE IF NOT EXISTS `canchas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `tipo_suelo` VARCHAR(50) NOT NULL,
  `precio_hora` DECIMAL(10, 2) NOT NULL,
  `deporte` VARCHAR(50) NOT NULL DEFAULT 'FÚTBOL',
  `activo` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Tabla de Horarios Operativos
CREATE TABLE IF NOT EXISTS `horarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cancha_id` INT NOT NULL,
  `dia_semana` INT NOT NULL, -- 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  CONSTRAINT `fk_horarios_cancha` FOREIGN KEY (`cancha_id`) 
    REFERENCES `canchas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de Reservas
CREATE TABLE IF NOT EXISTS `reservas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `cancha_id` INT NOT NULL,
  `fecha_reserva` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `total_pago` DECIMAL(10, 2) NOT NULL,
  `reembolso` DECIMAL(10, 2) DEFAULT 0.00,
  `penalidad` DECIMAL(10, 2) DEFAULT 0.00,
  `estado` ENUM('APROBADO', 'CANCELADO') NOT NULL DEFAULT 'APROBADO',
  CONSTRAINT `fk_reservas_usuario` FOREIGN KEY (`usuario_id`) 
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reservas_cancha` FOREIGN KEY (`cancha_id`) 
    REFERENCES `canchas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `uq_reserva_cancha_fecha_hora` UNIQUE (`cancha_id`, `fecha_reserva`, `hora_inicio`)
) ENGINE=InnoDB;

-- Tabla de Auditorías (Log de transacciones)
CREATE TABLE IF NOT EXISTS `auditorias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NULL,
  `accion` VARCHAR(100) NOT NULL,
  `detalles` TEXT NULL,
  `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_auditorias_usuario` FOREIGN KEY (`usuario_id`) 
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ==========================================
-- 3. INSERCIÓN DE DATOS INICIALES Y SEMILLAS
-- ==========================================

-- Insertar Usuarios por defecto (Contraseña encriptada '123456' o 'password123')
-- Hash bcrypt para '123456': $2a$10$w0YEA1Sq8mRWe7ZPzMs/uu5EI3hyGN20Sj26rWKWXaWRB6DdIth/G
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`) 
VALUES 
  (1, 'Administrador CanchaYA', 'admin@canchaya.com', '$2a$10$w0YEA1Sq8mRWe7ZPzMs/uu5EI3hyGN20Sj26rWKWXaWRB6DdIth/G', 'ADMIN'),
  (2, 'Lionel Messi', 'lionel.messi@canchaya.com', '$2a$10$w0YEA1Sq8mRWe7ZPzMs/uu5EI3hyGN20Sj26rWKWXaWRB6DdIth/G', 'CLIENTE'),
  (3, 'Cristiano Ronaldo', 'cristiano.ronaldo@canchaya.com', '$2a$10$w0YEA1Sq8mRWe7ZPzMs/uu5EI3hyGN20Sj26rWKWXaWRB6DdIth/G', 'CLIENTE'),
  (4, 'Rafael Nadal', 'rafael.nadal@canchaya.com', '$2a$10$w0YEA1Sq8mRWe7ZPzMs/uu5EI3hyGN20Sj26rWKWXaWRB6DdIth/G', 'CLIENTE'),
  (5, 'LeBron James', 'lebron.james@canchaya.com', '$2a$10$w0YEA1Sq8mRWe7ZPzMs/uu5EI3hyGN20Sj26rWKWXaWRB6DdIth/G', 'CLIENTE'),
  (6, 'Juan Pérez', 'juan@gmail.com', '$2a$10$w0YEA1Sq8mRWe7ZPzMs/uu5EI3hyGN20Sj26rWKWXaWRB6DdIth/G', 'CLIENTE')
ON DUPLICATE KEY UPDATE 
  `nombre`=VALUES(`nombre`), `email`=VALUES(`email`), `password`=VALUES(`password`), `rol`=VALUES(`rol`);

-- Insertar Canchas Famosas Internacionales
INSERT INTO `canchas` (`id`, `nombre`, `tipo_suelo`, `precio_hora`, `deporte`, `activo`) 
VALUES 
  (1, 'Santiago Bernabéu Grass', 'GRASS', 80.00, 'FÚTBOL', 1),
  (2, 'Camp Nou Ayacucho', 'GRASS', 60.00, 'FÚTBOL', 1),
  (3, 'La Bombonera Losa', 'LOSA', 40.00, 'FÚTBOL', 1),
  (4, 'Wimbledon Centre Court', 'GRASS', 75.00, 'TENIS', 1),
  (5, 'Roland Garros Philippe-Chatrier', 'LOSA', 70.00, 'TENIS', 1),
  (6, 'Madison Square Garden Court', 'LOSA', 85.00, 'BÁSQUETBOL', 1),
  (7, 'Staples Center Arena', 'LOSA', 90.00, 'BÁSQUETBOL', 1),
  (8, 'Maracaná Sintético', 'GRASS', 65.00, 'FÚTBOL', 1)
ON DUPLICATE KEY UPDATE 
  `nombre`=VALUES(`nombre`), `tipo_suelo`=VALUES(`tipo_suelo`), `precio_hora`=VALUES(`precio_hora`), `deporte`=VALUES(`deporte`), `activo`=VALUES(`activo`);

-- Limpiar e Insertar Horarios Operativos (08:00 a 22:00 de Lunes a Domingo) para todas las canchas
DELETE FROM `horarios`;
INSERT INTO `horarios` (`cancha_id`, `dia_semana`, `hora_inicio`, `hora_fin`) 
VALUES
  -- Santiago Bernabéu
  (1,0,'08:00:00','22:00:00'),(1,1,'08:00:00','22:00:00'),(1,2,'08:00:00','22:00:00'),(1,3,'08:00:00','22:00:00'),(1,4,'08:00:00','22:00:00'),(1,5,'08:00:00','22:00:00'),(1,6,'08:00:00','22:00:00'),
  -- Camp Nou Ayacucho
  (2,0,'08:00:00','22:00:00'),(2,1,'08:00:00','22:00:00'),(2,2,'08:00:00','22:00:00'),(2,3,'08:00:00','22:00:00'),(2,4,'08:00:00','22:00:00'),(2,5,'08:00:00','22:00:00'),(2,6,'08:00:00','22:00:00'),
  -- La Bombonera Losa
  (3,0,'08:00:00','22:00:00'),(3,1,'08:00:00','22:00:00'),(3,2,'08:00:00','22:00:00'),(3,3,'08:00:00','22:00:00'),(3,4,'08:00:00','22:00:00'),(3,5,'08:00:00','22:00:00'),(3,6,'08:00:00','22:00:00'),
  -- Wimbledon Centre Court
  (4,0,'08:00:00','22:00:00'),(4,1,'08:00:00','22:00:00'),(4,2,'08:00:00','22:00:00'),(4,3,'08:00:00','22:00:00'),(4,4,'08:00:00','22:00:00'),(4,5,'08:00:00','22:00:00'),(4,6,'08:00:00','22:00:00'),
  -- Roland Garros
  (5,0,'08:00:00','22:00:00'),(5,1,'08:00:00','22:00:00'),(5,2,'08:00:00','22:00:00'),(5,3,'08:00:00','22:00:00'),(5,4,'08:00:00','22:00:00'),(5,5,'08:00:00','22:00:00'),(5,6,'08:00:00','22:00:00'),
  -- Madison Square Garden
  (6,0,'08:00:00','22:00:00'),(6,1,'08:00:00','22:00:00'),(6,2,'08:00:00','22:00:00'),(6,3,'08:00:00','22:00:00'),(6,4,'08:00:00','22:00:00'),(6,5,'08:00:00','22:00:00'),(6,6,'08:00:00','22:00:00'),
  -- Staples Center
  (7,0,'08:00:00','22:00:00'),(7,1,'08:00:00','22:00:00'),(7,2,'08:00:00','22:00:00'),(7,3,'08:00:00','22:00:00'),(7,4,'08:00:00','22:00:00'),(7,5,'08:00:00','22:00:00'),(7,6,'08:00:00','22:00:00'),
  -- Maracaná Sintético
  (8,0,'08:00:00','22:00:00'),(8,1,'08:00:00','22:00:00'),(8,2,'08:00:00','22:00:00'),(8,3,'08:00:00','22:00:00'),(8,4,'08:00:00','22:00:00'),(8,5,'08:00:00','22:00:00'),(8,6,'08:00:00','22:00:00');

-- Insertar Reservas de Prueba Realizadas (Aprobadas y Canceladas con Métricas Financieras)
INSERT INTO `reservas` (`id`, `usuario_id`, `cancha_id`, `fecha_reserva`, `hora_inicio`, `hora_fin`, `total_pago`, `reembolso`, `penalidad`, `estado`)
VALUES
  (1, 2, 1, '2026-08-10', '16:00:00', '18:00:00', 160.00, 0.00, 0.00, 'APROBADO'),
  (2, 3, 2, '2026-08-11', '18:00:00', '20:00:00', 120.00, 0.00, 0.00, 'APROBADO'),
  (3, 4, 4, '2026-08-12', '10:00:00', '12:00:00', 150.00, 0.00, 0.00, 'APROBADO'),
  (4, 5, 6, '2026-08-13', '19:00:00', '21:00:00', 170.00, 0.00, 0.00, 'APROBADO'),
  (5, 6, 3, '2026-08-14', '14:00:00', '15:00:00', 40.00, 40.00, 0.00, 'CANCELADO'),
  (6, 2, 8, '2026-08-15', '17:00:00', '19:00:00', 130.00, 65.00, 65.00, 'CANCELADO')
ON DUPLICATE KEY UPDATE 
  `total_pago`=VALUES(`total_pago`), `reembolso`=VALUES(`reembolso`), `penalidad`=VALUES(`penalidad`), `estado`=VALUES(`estado`);

-- Insertar Registros de Auditoría de Ejemplo
INSERT INTO `auditorias` (`id`, `usuario_id`, `accion`, `detalles`)
VALUES
  (1, 1, 'CREAR_CANCHA', 'Se registró la cancha Santiago Bernabéu Grass con precio S/ 80.00'),
  (2, 1, 'CREAR_CANCHA', 'Se registró la cancha Wimbledon Centre Court con precio S/ 75.00'),
  (3, 2, 'CREAR_RESERVA', 'Reserva exitosa #1 para Santiago Bernabéu Grass'),
  (4, 6, 'CANCELAR_RESERVA', 'Reserva #5 cancelada con reembolso de S/ 40.00')
ON DUPLICATE KEY UPDATE `accion`=VALUES(`accion`), `detalles`=VALUES(`detalles`);
