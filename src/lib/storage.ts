import type { Bill } from './bill.ts';

// localStorage can throw (private browsing, storage full); every access here fails quietly
const BILL = 'bsplitr';
const KEYS = 'bsplitr-keys';

function read(key: string) {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {}
}

function remove(key: string) {
	try {
		localStorage.removeItem(key);
	} catch {}
}

// The bill being edited on the home page, as JSON
export const localBill = {
	get: () => read(BILL),
	set: (b: Bill) => write(BILL, JSON.stringify(b)),
	clear: () => remove(BILL)
};

// Edit keys this browser holds (viewId -> editId), so read-only addresses stay editable for whoever has the key
function keys(): Record<string, string> {
	try {
		return JSON.parse(read(KEYS)!) || {};
	} catch {
		return {};
	}
}

export const editKey = (viewId: string): string | null => keys()[viewId] || null;

export function saveEditKey(viewId: string, editId: string) {
	write(KEYS, JSON.stringify({ ...keys(), [viewId]: editId }));
}

// Short-link storage from the first version of sharing
export const removeLegacy = () => remove('bsplitr-share');
