import { defineConfig, devices } from '@playwright/test';

const PORT = 8899;

// Runs against `netlify dev`, so shared links go through the real functions (with local blob storage)
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	use: {
		baseURL: `http://localhost:${PORT}`,
		permissions: ['clipboard-read', 'clipboard-write']
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: `npx --yes netlify-cli dev --offline --port ${PORT}`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: true,
		timeout: 180_000
	}
});
