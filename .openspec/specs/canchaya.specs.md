# Especificaciones de Comportamiento del Sistema (Gherkin)

## Módulo: Autenticación de Usuarios (HU-01, HU-02)
### Escenario: Registro de cuenta con correo ya existente
* **Dado que** la base de datos MySQL ya posee un usuario con el email "cliente@canchaya.com"
* **Cuando** un nuevo usuario intenta registrarse enviando el mismo email a `/auth/register`
* **Entonces** el sistema debe rechazar la inserción en la base de datos
* **Y** responder con un código HTTP 400 Bad Request y un JSON indicando "El correo electrónico ya está registrado".

## Módulo: Transacciones y Bloqueo General (HU-05, HU-13)
### Escenario: Prevención de Doble Agendamiento Simultáneo (Overbooking)
* **Dado que** la cancha ID 1 ("Maracaná Grass 1") ya tiene una reserva en estado "APROBADO" para la fecha "2026-07-10" a las "14:00"
* **Cuando** un segundo cliente intenta procesar una solicitud de pago y reserva para el mismo bloque de cancha, fecha y hora
* **Entonces** el backend debe atrapar la violación del índice único en MySQL
* **Y** rechazar la transacción devolviendo un código HTTP 400 Bad Request con el mensaje "El horario solicitado ya se encuentra reservado".

## Módulo Delta: Cancelaciones y Políticas de Reembolso (HU-07, HU-10)
### Escenario: Cancelación Oportuna (Políticas de Reembolso al 100%)
* **Dado que** un cliente autenticado posee una reserva aprobada con costo de "S/. 60.00" programada para "2026-07-10 19:00"
* **Y** la fecha y hora actual simulada del servidor es "2026-07-08 17:00" (Diferencia: 50 horas de anticipación)
* **Cuando** el cliente presiona el botón "Cancelar" y se dispara la petición `POST /reservas/{id}/cancelar`
* **Entonces** el backend debe computar una ventana superior a 24 horas
* **Y** actualizar la fila en MySQL configurando el estado a "CANCELADO", `reembolso = 60.00` y `penalidad = 0.00`
* **Y** retornar una respuesta exitosa HTTP 200.

### Escenario: Cancelación Tardía (Penalización del 50%)
* **Dado que** un cliente autenticado posee una reserva aprobada con costo de "S/. 60.00" programada para "2026-07-09 12:00"
* **Y** la fecha y hora actual simulada del servidor es "2026-07-08 17:00" (Diferencia: 19 horas de anticipación)
* **Cuando** el cliente procesa la cancelación
* **Entonces** el backend debe computar una ventana inferior a 24 horas
* **Y** actualizar la fila en MySQL configurando el estado a "CANCELADO", `reembolso = 30.00` y `penalidad = 30.00`
* **Y** retornar una respuesta HTTP 200 con el balance financiero parcial.