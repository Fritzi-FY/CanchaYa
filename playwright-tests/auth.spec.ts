import { test, expect } from '@playwright/test';

test.describe('Flujos de Autenticación', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ir a la aplicación antes de cada prueba
    await page.goto('/');
  });

  test('Debería mostrar la vista de inicio de sesión por defecto', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Iniciar Sesión');
    await expect(page.locator('[placeholder="ejemplo@correo.com"]')).toBeVisible();
    await expect(page.locator('[placeholder="••••••"]')).toBeVisible();
  });

  test('Debería navegar a la vista de registro y registrar un nuevo cliente con éxito', async ({ page }) => {
    // Hacer clic en "Regístrate aquí"
    await page.click('text=Regístrate aquí');
    
    // Verificar que estamos en la vista de registro
    await expect(page.locator('h2')).toContainText('Registrarse');

    // Generar un correo electrónico aleatorio para evitar colisiones
    const randomEmail = `testuser_${Date.now()}@example.com`;

    // Completar el formulario de registro
    await page.fill('[placeholder="Juan Pérez"]', 'Usuario E2E Prueba');
    await page.locator('form >> input[type="email"]').fill(randomEmail);
    await page.locator('form >> input[type="password"]').fill('password123');

    // Enviar formulario
    await page.click('button:has-text("Crear Cuenta")');

    // Verificar que aparece la notificación flotante de registro exitoso
    const successToast = page.locator('.fixed.bottom-4.right-4 >> text=¡Registro exitoso! Ya puedes iniciar sesión.');
    await expect(successToast).toBeVisible();

    // Comprobar que regresamos a la vista de login
    await expect(page.locator('h2')).toContainText('Iniciar Sesión');
  });

  test('Debería iniciar sesión y cerrar sesión correctamente como Cliente', async ({ page }) => {
    // Usaremos el usuario cliente sembrado: juan@gmail.com / password123
    await page.fill('[placeholder="ejemplo@correo.com"]', 'juan@gmail.com');
    await page.fill('[placeholder="••••••"]', 'password123');

    // Enviar el formulario
    await page.click('button:has-text("Ingresar")');

    // Verificar inicio de sesión exitoso mediante la notificación y visualización de la cabecera/rol
    await expect(page.locator('.fixed.bottom-4.right-4 >> text=¡Sesión iniciada con éxito!')).toBeVisible();
    await expect(page.locator('text=Rol: CLIENTE')).toBeVisible();
    await expect(page.locator('text=Mis Reservas Activas')).toBeVisible();

    // Cerrar sesión
    await page.click('button:has-text("Salir")');

    // Verificar que redirige a iniciar sesión
    await expect(page.locator('h2')).toContainText('Iniciar Sesión');
  });

  test('Debería iniciar sesión exitosamente como Administrador', async ({ page }) => {
    // Usaremos el admin sembrado: admin@canchaya.com / 123456
    await page.fill('[placeholder="ejemplo@correo.com"]', 'admin@canchaya.com');
    await page.fill('[placeholder="••••••"]', '123456');

    // Enviar el formulario
    await page.click('button:has-text("Ingresar")');

    // Verificar inicio de sesión exitoso y visualización de controles de administrador
    await expect(page.locator('.fixed.bottom-4.right-4 >> text=¡Sesión iniciada con éxito!')).toBeVisible();
    await expect(page.locator('text=Rol: ADMIN')).toBeVisible();
    await expect(page.locator('button:has-text("Dashboard Admin")')).toBeVisible();
  });

  test('Debería mostrar error con credenciales inválidas', async ({ page }) => {
    // Login con datos erróneos
    await page.fill('[placeholder="ejemplo@correo.com"]', 'error@canchaya.com');
    await page.fill('[placeholder="••••••"]', 'incorrecta');
    await page.click('button:has-text("Ingresar")');

    // Comprobar toast de error
    await expect(page.locator('.fixed.bottom-4.right-4')).toContainText('inválidas');
  });
});
