# Arquitectura del Sistema y Modelo de Base de Datos - CanchaYA

Este documento técnico describe la arquitectura de software, el diseño de la base de datos relacional y las decisiones clave del proyecto **CanchaYA**.

---

## 1. Arquitectura General del Sistema

La arquitectura de CanchaYA sigue el patrón **Monolito Modular Servidor-Cliente (REST API + SPA)** en tres capas principales:

```
+-------------------------------------------------------+
|                   CAPA DE PRESENTACIÓN                |
|       Frontend Single Page Application (SPA)          |
|      HTML5 + TailwindCSS + React UMD + Chart.js       |
+-------------------------------------------------------+
                           |
                     Peticiones HTTP
                    (JSON / JWT Bearer)
                           v
+-------------------------------------------------------+
|                    CAPA DE NEGOCIO                    |
|             Backend Node.js / Express API             |
|     Middlewares (Auth, RBAC, Validation, Errors)      |
|    Controllers & Services (Reserva, Auth, Cancha)     |
+-------------------------------------------------------+
                           |
                        ORM / SQL
                    (Sequelize / mysql2)
                           v
+-------------------------------------------------------+
|                  CAPA DE PERSISTENCIA                 |
|                   MySQL 8.0 Database                  |
|  (usuarios, canchas, horarios, reservas, auditorias) |
+-------------------------------------------------------+
```

---

## 2. Modelo Entidad-Relación de la Base de Datos

```mermaid
erDiagram
    USUARIOS {
        int id PK
        string nombre
        string email UK
        string password
        string rol
    }

    CANCHAS {
        int id PK
        string nombre
        string tipo_suelo
        decimal precio_hora
        string deporte
        boolean activo
    }

    HORARIOS {
        int id PK
        int cancha_id FK
        int dia_semana
        time hora_inicio
        time hora_fin
    }

    RESERVAS {
        int id PK
        int usuario_id FK
        int cancha_id FK
        date fecha_reserva
        time hora_inicio
        time hora_fin
        decimal total_pago
        decimal reembolso
        decimal penalidad
        enum estado
    }

    AUDITORIAS {
        int id PK
        int usuario_id FK
        string accion
        text detalles
        timestamp fecha
    }

    USUARIOS ||--o{ RESERVAS : "realiza"
    CANCHAS ||--o{ RESERVAS : "es reservada en"
    CANCHAS ||--o{ HORARIOS : "tiene horarios en"
    USUARIOS ||--o{ AUDITORIAS : "genera"
```

---

## 3. Algoritmo de Política de Cancelaciones y Reembolsos

El cálculo financiero se ejecuta de forma determinista en el servidor mediante la siguiente función pura:

$$\text{DiferenciaHoras} = \frac{\text{FechaReserva} - \text{FechaActual}}{3600000}$$

$$\text{Resultado} = \begin{cases} 
\text{Reembolso} = 100\%, \text{Penalidad} = 0\% & \text{si } \text{DiferenciaHoras} > 24 \\
\text{Reembolso} = 50\%, \text{Penalidad} = 50\% & \text{si } 2 \le \text{DiferenciaHoras} \le 24 \\
\text{Reembolso} = 0\%, \text{Penalidad} = 100\% & \text{si } \text{DiferenciaHoras} < 2
\end{cases}$$

---

## 4. Estrategia de Seguridad

- **Contraseñas**: Hasheadas con **bcryptjs** (10 salt rounds).
- **Autenticación**: JSON Web Tokens (**JWT**) firmados con la clave `JWT_SECRET` y expiración en 24 horas.
- **Autorización por Roles (RBAC)**: Middleware `authMiddleware` valida la presencia del token Bearer y restringe endpoints administrativos al rol `ADMIN`.
- **Integridad de Datos**: Restricción de unicidad a nivel de MySQL (`uq_reserva_cancha_fecha_hora`) para evitar sobre-reservas en condiciones de concurrencia.
