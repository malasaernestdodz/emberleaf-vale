import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 400, height: 225 },
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
    },
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
