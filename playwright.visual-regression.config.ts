import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for permanent visual regression testing
 * This configuration is separate from the migration testing config
 * and doesn't require a web server since it generates its own HTML content
 */
export default defineConfig({
    testDir: './tests/visual-regression',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { outputFolder: 'tests/visual-regression/reports/playwright-report' }],
        ['json', { outputFile: 'tests/visual-regression/reports/results.json' }],
        ['list']
    ],
    use: {
    // No baseURL needed since we generate HTML content directly
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { 
                ...devices['Desktop Chrome'],
                // Ensure consistent rendering across environments
                colorScheme: 'light',
            },
        },
    ],
    // No webServer needed - we generate HTML content directly in tests
    timeout: 30000, // 30 seconds per test
    expect: {
    // Timeout for expect() calls
        timeout: 10000,
    },
});