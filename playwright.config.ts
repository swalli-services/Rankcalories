import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 30_000,
  use: {
    browserName: 'chromium',
    channel: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'auth',
      testMatch: 'auth.spec.ts',
      use: { baseURL: 'http://127.0.0.1:5176' },
    },
    {
      name: 'pending',
      testMatch: 'pending.spec.ts',
      use: { baseURL: 'http://127.0.0.1:5177' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5176 --strictPort',
      url: 'http://127.0.0.1:5176',
      reuseExistingServer: false,
      env: {
        VITE_SUPABASE_URL: 'https://auth.nutrilog.test',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only_do_not_use',
        VITE_GOOGLE_AUTH_ENABLED: 'true',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5177 --strictPort',
      url: 'http://127.0.0.1:5177',
      reuseExistingServer: false,
      env: {
        VITE_SUPABASE_URL: '',
        VITE_SUPABASE_PUBLISHABLE_KEY: '',
        VITE_GOOGLE_AUTH_ENABLED: 'false',
      },
    },
  ],
})
