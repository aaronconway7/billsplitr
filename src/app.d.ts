// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {}
	// Embedded by netlify/functions/page.mjs on /<viewId> and /e/<editId>
	interface Window {
		SHARED?: string;
		VIEW_ID?: string;
		EDIT_ID?: string | null;
	}
}

export {};
