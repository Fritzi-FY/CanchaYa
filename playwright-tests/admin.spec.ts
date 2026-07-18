import { test, expect } from '@playwright/test';

test.describe('Portal de Administración y Monitoreo', () => {

  test.beforeEach(async ({ page }) => {
    // Iniciar sesión como Admin antes de cada test de administración
    await page.goto('/');
    await page.fill('[placeholder="ejemplo@correo.com"]', 'admin@canchaya.com');
    await page.fill('[placeholder="••••••"]', '123456');
    await page.click('button:has-text("Ingresar")');
    await expect(page.locator('text=Rol: ADMIN')).toBeVisible();

    // Navegar al dashboard administrativo
    await page.click('button:has-text("Dashboard Admin")');
    await expect(page.locator('h3:has-text("Gestión de Catálogo de Canchas")')).toBeVisible();
  });

  test('Debería mostrar métricas y gráficos en el Dashboard Financiero', async ({ page }) => {
    // Verificar que las tarjetas de métricas sean visibles y contengan datos
    await expect(page.locator('text=Ingresos Totales (Caja)')).toBeVisible();
    await expect(page.locator('text=Transacciones Realizadas')).toBeVisible();
    await expect(page.locator('text=Pérdidas (Reembolsos)')).toBeVisible();
    await expect(page.locator('text=Recaudado por Penalidades')).toBeVisible();

    // Validar presencia de los canvas de gráficos
    const countCanvas = await page.locator('canvas').count();
    expect(countCanvas).toBe(2);
  });

  test('Debería crear una nueva cancha y luego desactivarla con éxito', async ({ page }) => {
    const randomSuffix = Math.floor(Math.random() * 1000);
    const nombreNuevaCancha = `Estadio Azteca ${randomSuffix}`;

    // 1. CREACIÓN DE CANCHA (CRUD)
    await page.fill('[placeholder="Ej. Santiago Bernabéu Losa"]', nombreNuevaCancha);
    await page.selectOption('select:has-text("Césped Sintético")', 'GRASS');
    await page.fill('input[type="number"]', '75');
    await page.selectOption('select:has-text("Fútbol")', 'FÚTBOL');

    // Hacer clic en Añadir Cancha
    await page.click('button:has-text("Añadir Cancha")');

    // Verificar notificación de éxito
    await expect(page.locator('.fixed.bottom-4.right-4 >> text=Nueva cancha creada.')).toBeVisible();

    // Verificar presencia de la cancha en la lista de gestión
    const itemCancha = page.locator(`div:has-text("${nombreNuevaCancha}")`);
    await expect(itemCancha.first()).toBeVisible();
    await expect(itemCancha.first()).toContainText('Activo');

    // 2. DESACTIVACIÓN DE CANCHA (Manejo de diálogo confirm)
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('¿Seguro que deseas desactivar esta cancha?');
      await dialog.accept();
    });

    // Hacer clic en el botón Desactivar para la cancha recién creada
    const itemFila = page.locator(`div.p-3.border:has-text("${nombreNuevaCancha}")`);
    await itemFila.locator('button:has-text("Desactivar")').click();

    // Verificar notificación de éxito en la desactivación
    await expect(page.locator('.fixed.bottom-4.right-4 >> text=Cancha desactivada correctamente.')).toBeVisible();

    // Comprobar que el estado cambió a Inactivo
    await expect(itemFila).toContainText('Inactivo');
  });

  test('Debería registrar operaciones en la Bitácora de Transacciones Global (Audit Log)', async ({ page }) => {
    // Comprobar que la bitácora contiene logs de auditoría
    const logSection = page.locator('h3:has-text("Bitácora de Transacciones Global")');
    await expect(logSection).toBeVisible();

    // Verificar que existan registros listados en el log
    const logEntries = page.locator('div.border-l-4.border-emerald-600');
    const count = await logEntries.count();
    expect(count).toBeGreaterThan(0);
  });
});
