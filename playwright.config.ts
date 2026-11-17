import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 30000,
    workers: 1,

    reporter: 'html',

    use: {
        baseURL: 'https://dispatch-hub-se-project.vercel.app',
        browserName: 'chromium',
        headless: false,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',

        launchOptions: {
            slowMo: 500
        }
    }
});
