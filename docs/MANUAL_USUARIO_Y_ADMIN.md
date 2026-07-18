# Manual de Usuario y Administrador - CanchaYA

Este manual describe el funcionamiento completo de la plataforma **CanchaYA**, tanto para clientes como para administradores.

---

## 1. Módulo de Clientes

### 1.1 Registro de Usuario y Autenticación
1. **Registro**:
   - Accede a la plataforma y selecciona el botón **"Registrarse"**.
   - Completa tu nombre completo, correo electrónico y contraseña (mínimo 6 caracteres).
   - Haz clic en **"Crear Cuenta"**.
2. **Inicio de Sesión**:
   - Ingresa tu correo y contraseña.
   - El sistema validará tus credenciales y guardará un token JWT seguro para mantener tu sesión activa.

### 1.2 Búsqueda y Filtrado de Canchas
1. Navega al catálogo principal de canchas.
2. Filtra las opciones disponibles por:
   - **Deporte / Tipo de suelo**: Gras Sintético o Losa Deportiva.
   - **Fecha y Rango Horario**: Selecciona el día deseado (de 08:00 a 22:00 hrs).
3. El sistema ocultará automáticamente aquellos horarios que ya se encuentren reservados o fuera del horario operativo.

### 1.3 Creación de Reserva y Simulación de Pago
1. Selecciona la cancha y el horario deseado.
2. Revisa el resumen con la tarifa por hora y el total a pagar.
3. Haz clic en **"Confirmar y Pagar"**.
4. Se ejecutará la pasarela simulada de pago. Una vez aprobado, recibirás la confirmación con tu código de reserva único.

### 1.4 Mis Reservas y Política de Cancelación
Puedes consultar tus reservas desde la pestaña **"Mis Reservas"**. Cada reserva muestra su estado (`APROBADO` o `CANCELADO`).

#### Reglas de Cancelación y Reembolso:
- **Con más de 24 horas de anticipación**: Reembolso del **100%** de lo pagado.
- **Entre 2 y 24 horas antes**: Reembolso del **50%** (se aplica una penalidad del 50%).
- **Con menos de 2 horas de anticipación**: Reembolso del **0%** (penalidad del 100%).

---

## 2. Módulo de Administración

### 2.1 Credenciales por Defecto del Administrador
- **Correo**: `admin@canchaya.com`
- **Contraseña**: `123456`

### 2.2 Dashboard Financiero (Reporte de Ingresos y Pérdidas)
Desde el panel administrativo, puedes visualizar en tiempo real:
- **Ingresos Totales Brutos**: Suma de pagos de reservas activas e ingresos por penalidades de cancelación.
- **Pérdidas por Cancelación**: Monto total devuelto a los clientes en concepto de reembolsos.
- **Total de Reservas**: Desglose entre reservas aprobadas y canceladas.

### 2.3 Gestión del Ciclo de Vida de Canchas
- **Crear Cancha**: Registrar nuevos escenarios deportivos especificando nombre, tipo de suelo y tarifa por hora.
- **Desactivar Cancha**: Permite suspender temporalmente una cancha sin eliminar el historial de reservas asociadas.
- **Reactivar Cancha**: Vuelve a habilitar la cancha para que aparezca en el catálogo público de clientes.

### 2.4 Registro de Auditorías (Audit Logs)
El sistema registra automáticamente todas las acciones críticas ejecutadas por los administradores (creación/desactivación de canchas, cancelaciones manuales y modificaciones de estado).
