import { defineParams } from '@sveltejs/kit/params';

const ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const BILL = new RegExp(`^(e/)?${ID}$`);

export const params = defineParams({
	// '' is the home page; /<viewId> and /e/<editId> are shared bills, served by netlify/functions/page.mjs
	bill: (p) => (p === '' || BILL.test(p) ? p : undefined)
});
