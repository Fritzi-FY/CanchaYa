import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright-tests',
  timeout: 45000, // Aumentamos el timeout a 45 segundos para dar margen al arranque y base de datos
  expect: {
    timeout: 8000,
  },
  fullyParallel: false,
  workers: 1, // Ejecutar secuencialmente para evitar colisiones en la base de datos de pruebas
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npx http-server canchaya-frontend -p 8080',
      port: 8080,
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npx cross-env PORT=3000 NODE_ENV=test_e2e npm --prefix canchaya-backend run dev',
      port: 3000,
      timeout: 60000,
      reuseExistingServer: false,
    }
  ],
});
