import type { Bill, Item } from './bill.ts';

// The share string format is stored in blobs and old #hash links, so it must not change:
// base64url JSON of [p, [[n,a,s]...], sc, pd, c], or 'z' + base64url of the same JSON deflate-raw compressed.
// Legacy base64 JSON always starts with 'e' or 'W', so the 'z' prefix is unambiguous.

const url64 = (s: string) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const pad64 = (s: string) => {
	s = s.replace(/-/g, '+').replace(/_/g, '/');
	while (s.length % 4) s += '=';
	return s;
};

export function b64e(s: string) {
	return url64(btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16)))));
}

export function b64d(s: string) {
	const b = atob(pad64(String(s || '')));
	let u = '';
	for (let i = 0; i < b.length; i++) u += '%' + b.charCodeAt(i).toString(16).padStart(2, '0');
	return decodeURIComponent(u);
}

function u8e(u: Uint8Array) {
	let s = '';
	for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
	return url64(btoa(s));
}

function u8d(s: string) {
	const b = atob(pad64(s));
	const u = new Uint8Array(b.length);
	for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
	return u;
}

export const pack = (b: Bill) => JSON.stringify([b.p, b.i.map((it) => [it.n, it.a, it.s]), b.sc, b.pd, b.c]);

export function enc(b: Bill) {
	try {
		return b64e(pack(b));
	} catch {
		return '';
	}
}

// The shortest of the compressed and plain encodings
export async function encZ(b: Bill) {
	const p = enc(b);
	if (typeof CompressionStream === 'undefined') return p;
	try {
		const st = new Blob([new TextEncoder().encode(pack(b))]).stream().pipeThrough(new CompressionStream('deflate-raw'));
		const z = 'z' + u8e(new Uint8Array(await new Response(st).arrayBuffer()));
		return z.length < p.length ? z : p;
	} catch {
		return p;
	}
}

export async function dec(h: string) {
	if (h.charAt(0) !== 'z') return b64d(h);
	const st = new Blob([u8d(h.slice(1))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
	return new Response(st).text();
}

function normItem(it: unknown): Item {
	let n: unknown = '', a = 0, s: unknown = [];
	if (Array.isArray(it)) [n, a, s] = [it[0], +it[1], it[2]];
	else if (it && typeof it === 'object') {
		const o = it as Record<string, unknown>;
		[n, a, s] = [o.n, Number(o.a), o.s];
	}
	return {
		n: n ? String(n) : '',
		a: isFinite(a) && a >= 0 ? a : 0,
		s: Array.isArray(s) ? s.filter((x) => Number.isInteger(x) && x >= 0) : []
	};
}

// Accepts the packed array form and the older { p, i, sc, pd, c } object form; null if neither
export function norm(o: unknown): Bill | null {
	let p: unknown, i: unknown, sc: unknown, pd: unknown, c: unknown;
	if (Array.isArray(o) && Array.isArray(o[0]) && Array.isArray(o[1])) {
		[p, i, sc, pd] = o;
		c = typeof o[4] === 'string' ? o[4] : 'GBP';
	} else if (o && typeof o === 'object' && Array.isArray((o as Bill).p) && Array.isArray((o as Bill).i)) {
		({ p, i, sc, pd } = o as Bill);
		c = (o as Bill).c || 'GBP';
	} else return null;
	const scn = Number(sc), pdn = Number(pd);
	return {
		p: (p as unknown[]).map(String),
		i: (i as unknown[]).map(normItem),
		sc: isFinite(scn) && scn >= 0 ? scn : 0,
		pd: Number.isInteger(pdn) ? pdn : -1,
		c: c as string
	};
}
