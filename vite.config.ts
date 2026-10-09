import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// A single prerendered page; shared bills (/<viewId>, /e/<editId>) are served by
			// netlify/functions/page.mjs, which injects the bill into build/index.html
			adapter: adapter(),
			// Absolute asset paths, since /e/<editId> serves the same HTML as /
			paths: { relative: false }
		})
	],
	test: { include: ['src/**/*.test.ts'] }
});
