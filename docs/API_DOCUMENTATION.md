# Especificación de la API REST - CanchaYA

Base URL: `http://localhost:3000/api`

---

## 1. Módulo de Autenticación (`/api/auth`)

### 1.1 Registrar Usuario
- **POST** `/auth/register`
- **Body**:
  ```json
  {
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }
  ```
- **Respuesta (201 Created)**:
  ```json
  {
    "id": 2,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "CLIENTE"
  }
  ```

### 1.2 Iniciar Sesión
- **POST** `/auth/login`
- **Body**:
  ```json
  {
    "email": "juan@example.com",
    "password": "password123"
  }
  ```
- **Respuesta (200 OK)**:
  ```json
  {
    "message": "Login exitoso",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 2,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "rol": "CLIENTE"
    }
  }
  ```

---

## 2. Módulo de Canchas (`/api/canchas`)

### 2.1 Listar Canchas Activas
- **GET** `/canchas`
- **Respuesta (200 OK)**: Array de objetos cancha.

### 2.2 Consultar Disponibilidad
- **GET** `/canchas/disponibles?fecha=YYYY-MM-DD`
- **Respuesta (200 OK)**: Canchas con sus horarios disponibles.

### 2.3 Crear Cancha (Solo Admin)
- **POST** `/canchas`
- **Headers**: `Authorization: Bearer <token_admin>`
- **Body**:
  ```json
  {
    "nombre": "Estadio San Cristóbal",
    "tipo_suelo": "GRASS",
    "precio_hora": 70.00
  }
  ```

### 2.4 Desactivar/Reactivar Cancha (Solo Admin)
- **PATCH** `/canchas/:id/estado`
- **Headers**: `Authorization: Bearer <token_admin>`
- **Body**:
  ```json
  {
    "activo": false
  }
  ```

---

## 3. Módulo de Reservas (`/api/reservas`)

### 3.1 Crear Reserva
- **POST** `/reservas`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "cancha_id": 1,
    "fecha_reserva": "2026-08-15",
    "hora_inicio": "14:00",
    "hora_fin": "16:00"
  }
  ```
- **Respuesta (201 Created)**:
  ```json
  {
    "id": 5,
    "cancha_id": 1,
    "fecha_reserva": "2026-08-15",
    "hora_inicio": "14:00:00",
    "hora_fin": "16:00:00",
    "total_pago": 120.00,
    "estado": "APROBADO"
  }
  ```

### 3.2 Listar Mis Reservas
- **GET** `/reservas/mis-reservas`
- **Headers**: `Authorization: Bearer <token>`

### 3.3 Cancelar Reserva
- **POST** `/reservas/:id/cancelar`
- **Headers**: `Authorization: Bearer <token>`
- **Respuesta (200 OK)**:
  ```json
  {
    "message": "Reserva cancelada exitosamente",
    "reembolso": 120.00,
    "penalidad": 0.00
  }
  ```

### 3.4 Reporte Financiero (Solo Admin)
- **GET** `/reservas/admin/reporte`
- **Headers**: `Authorization: Bearer <token_admin>`
- **Respuesta (200 OK)**:
  ```json
  {
    "ingresosTotales": 450.00,
    "perdidasReembolso": 60.00,
    "reservasAprobadas": 8,
    "reservasCanceladas": 2
  }
  ```
