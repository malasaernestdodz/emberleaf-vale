import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: 30_000 },
  outputDir: 'test-results-kilo',
  use: {
    baseURL: 'http://localhost:4322',
    viewport: { width: 400, height: 225 },
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
    },
  },
  webServer: {
    command: 'npm run preview -- --port 4322 --strictPort',
    port: 4322,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
