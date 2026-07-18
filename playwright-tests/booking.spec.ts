import { test, expect } from '@playwright/test';

test.describe('Catálogo y Reserva de Canchas', () => {

  test.beforeEach(async ({ page }) => {
    // Iniciar sesión como Juan Cliente antes de cada test de reserva
    await page.goto('/');
    await page.fill('[placeholder="ejemplo@correo.com"]', 'juan@gmail.com');
    await page.fill('[placeholder="••••••"]', 'password123');
    await page.click('button:has-text("Ingresar")');
    await expect(page.locator('text=Rol: CLIENTE')).toBeVisible();
  });

  test('Debería poder filtrar las canchas por deporte', async ({ page }) => {
    // Verificar que inicialmente el dropdown de canchas tiene todas las canchas (3 opciones por defecto)
    let optionsCount = await page.locator('select >> option').count();
    expect(optionsCount).toBeGreaterThan(1);

    // Filtrar por TENIS
    await page.click('button:has-text("TENIS")');

    // Confirmar que el dropdown ahora solo tiene canchas de Tenis (Roland Garros, es decir, 1 opción)
    optionsCount = await page.locator('select >> option').count();
    expect(optionsCount).toBe(1);
    await expect(page.locator('select')).toContainText('Roland Garros Arcilla');

    // Filtrar de vuelta a TODOS
    await page.click('button:has-text("TODOS")');
    optionsCount = await page.locator('select >> option').count();
    expect(optionsCount).toBe(3);
  });

  function getFormattedDate(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  test('Debería reservar una cancha y verificar prevención de sobrebooking', async ({ page }) => {
    // Reservaremos para dentro de 10 días a las 11:00 (slot de 11:00:00 a 12:00:00) en Camp Nou Ayacucho
    const dateStr = getFormattedDate(10);

    // Seleccionar Camp Nou Ayacucho (ID 1)
    await page.selectOption('select', '1');
    
    // Ingresar la fecha futura
    await page.locator('input[type="date"]').fill(dateStr);

    // Esperar a que se actualicen los slots
    await page.waitForTimeout(500);

    // Hacer clic en el slot de las 11:00 (debe estar disponible y decir Alquilar)
    const slotButton = page.locator('button:has-text("11:00")');
    await expect(slotButton).toContainText('⚡ Alquilar');
    await slotButton.click();

    // Comprobar que se abre la pasarela de pago
    await expect(page.locator('h3:has-text("Checkout Pasarela CanchaYA")')).toBeVisible();

    // Rellenar datos de pago simulados
    await page.fill('[placeholder="4111 2222 3333 4444"]', '4111222233334444');
    await page.fill('[placeholder="MM/YY"]', '12/28');
    await page.fill('[placeholder="123"]', '123');

    // Confirmar el pago
    await page.click('button:has-text("Pagar S/.")');

    // Verificar notificación de éxito
    await expect(page.locator('.fixed.bottom-4.right-4 >> text=Pago aprobado. ¡Cancha reservada con éxito!')).toBeVisible();

    // Verificar que la reserva se muestra en "Mis Reservas Activas"
    const reservaBlock = page.locator(`div.bg-gray-50:has-text("${dateStr}"):has-text("11:00 - 12:00"):has-text("APROBADO")`).first();
    await expect(reservaBlock).toContainText('Camp Nou Ayacucho');
    await expect(reservaBlock).toContainText(dateStr);
    await expect(reservaBlock).toContainText('11:00 - 12:00');
    await expect(reservaBlock).toContainText('APROBADO');

    // --- PREVENCIÓN DE SOBREBOOKING (HU-13) ---
    // Comprobar que en la cuadrícula de horarios el slot de las 11:00 ahora se encuentra marcado como reservado y deshabilitado
    const bookedSlotButton = page.locator('button:has-text("11:00")');
    await expect(bookedSlotButton).toContainText('🚫 Reservado');
    await expect(bookedSlotButton).toBeDisabled();

    // Limpieza: Cancelar la reserva para que la base de datos quede limpia en ejecuciones repetidas
    await reservaBlock.locator('button:has-text("Cancelar Reserva")').click();
    await page.click('button:has-text("Confirmar Cancelación")');
    await expect(page.locator('.fixed.bottom-4.right-4 >> text=Reserva cancelada correctamente.')).toBeVisible();
  });

  test('Debería cancelar una reserva lejana y recibir reembolso del 100%', async ({ page }) => {
    // Reservaremos para dentro de 6 días a las 16:00 (Camp Nou Ayacucho)
    const dateStr = getFormattedDate(6);

    await page.selectOption('select', '1');
    await page.locator('input[type="date"]').fill(dateStr);
    await page.waitForTimeout(500);

    // Alquilar a las 16:00
    await page.locator('button:has-text("16:00")').click();
    await page.fill('[placeholder="4111 2222 3333 4444"]', '4111222233334444');
    await page.fill('[placeholder="MM/YY"]', '12/28');
    await page.fill('[placeholder="123"]', '123');
    await page.click('button:has-text("Pagar S/.")');

    // Esperar toast de éxito
    await expect(page.locator('.fixed.bottom-4.right-4 >> text=Pago aprobado. ¡Cancha reservada con éxito!')).toBeVisible();

    // Localizar la nueva reserva activa
    const reservaACancelar = page.locator(`div.bg-gray-50:has-text("${dateStr}"):has-text("16:00 - 17:00"):has-text("APROBADO")`).first();
    await expect(reservaACancelar).toBeVisible();

    // 2. Hacer clic en "Cancelar Reserva"
    await reservaACancelar.locator('button:has-text("Cancelar Reserva")').click();

    // Verificar modal de confirmación y el reembolso del 100% (>24 horas de anticipación)
    await expect(page.locator('h3:has-text("Confirmar Cancelación")')).toBeVisible();
    await expect(page.locator('text=Reembolso Estimado: S/. 60.00')).toBeVisible();
    await expect(page.locator('text=Penalidad Aplicada: S/. 0.00')).toBeVisible();

    // Confirmar
    await page.click('button:has-text("Confirmar Cancelación")');

    // Verificar notificación de cancelación exitosa
    await expect(page.locator('.fixed.bottom-4.right-4 >> text=Reserva cancelada correctamente.')).toBeVisible();

    // Verificar que el bloque de reserva ahora muestra el estado "CANCELADO"
    const reservaCancelada = page.locator(`div.bg-gray-50:has-text("${dateStr}"):has-text("16:00 - 17:00"):has-text("CANCELADO")`).first();
    await expect(reservaCancelada.locator('span:has-text("CANCELADO")')).toBeVisible();
    await expect(reservaCancelada).toContainText('Reembolsado: S/. 60');
    await expect(reservaCancelada).toContainText('Penalidad: S/. 0');
  });
});
