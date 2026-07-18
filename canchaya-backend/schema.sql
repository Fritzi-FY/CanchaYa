-- Script para configurar las bases de datos de CanchaYA (canchaya_db y canchaya_test_db)

-- ==========================================
-- 1. BASE DE DATOS DE PRUEBAS (canchaya_test_db)
-- ==========================================
-- Para las pruebas automatizadas (npm run test), solo es necesario que exista la base de datos vacía,
-- ya que Sequelize se encarga de crear las tablas y sembrar los datos en cada ejecución (force: true).
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
-- 3. INSERCIÓN DE DATOS INICIALES (Semillas/Seeds) en canchaya_db
-- ==========================================

-- Insertar Canchas por defecto si no existen
INSERT INTO `canchas` (`id`, `nombre`, `tipo_suelo`, `precio_hora`) 
VALUES 
  (1, 'Camp Nou Ayacucho', 'GRASS', 60.00),
  (2, 'La Bombonera Losa', 'LOSA', 40.00)
ON DUPLICATE KEY UPDATE `nombre`=VALUES(`nombre`), `tipo_suelo`=VALUES(`tipo_suelo`), `precio_hora`=VALUES(`precio_hora`);

-- Insertar Usuario Administrador por defecto si no existe (contraseña encriptada para '123456')
-- Hash generado usando bcrypt (10 rounds) para '123456': $2a$10$QpWqQjWlU6tWixvWvT6w3OSq2OqgU1GeqyT.g81w0f/6Fh838d172
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`) 
VALUES 
  (1, 'Administrador CanchaYA', 'admin@canchaya.com', '$2a$10$QpWqQjWlU6tWixvWvT6w3OSq2OqgU1GeqyT.g81w0f/6Fh838d172', 'ADMIN')
ON DUPLICATE KEY UPDATE `email`=VALUES(`email`);

-- Limpiar horarios anteriores para evitar duplicados
DELETE FROM `horarios`;

-- Insertar Horarios operativos (08:00 a 22:00 para todos los días 0-6) para ambas canchas
INSERT INTO `horarios` (`cancha_id`, `dia_semana`, `hora_inicio`, `hora_fin`) 
VALUES
  -- Cancha 1: Camp Nou Ayacucho
  (1, 0, '08:00:00', '22:00:00'),
  (1, 1, '08:00:00', '22:00:00'),
  (1, 2, '08:00:00', '22:00:00'),
  (1, 3, '08:00:00', '22:00:00'),
  (1, 4, '08:00:00', '22:00:00'),
  (1, 5, '08:00:00', '22:00:00'),
  (1, 6, '08:00:00', '22:00:00'),
  -- Cancha 2: La Bombonera Losa
  (2, 0, '08:00:00', '22:00:00'),
  (2, 1, '08:00:00', '22:00:00'),
  (2, 2, '08:00:00', '22:00:00'),
  (2, 3, '08:00:00', '22:00:00'),
  (2, 4, '08:00:00', '22:00:00'),
  (2, 5, '08:00:00', '22:00:00'),
  (2, 6, '08:00:00', '22:00:00');
