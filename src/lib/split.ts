import type { Bill, Item } from './bill.ts';

// Everything in pence. Shared items split by weight (evenly unless an item says otherwise); service is worked out on the whole
// bill and shared in proportion to what each person ordered, with the share for unassigned items (plus any odd pennies)
// held back in unSvc until they're assigned.
// Pennies that don't divide evenly go by largest remainder (ties to the earliest), so every column adds up exactly.
export type Split = ReturnType<typeof calc>;

// total shared out in proportion to weights, in whole pennies
export function allocate(total: number, weights: number[]) {
	const sum = weights.reduce((a, w) => a + w, 0);
	if (!sum || !total) return weights.map(() => 0);
	const exact = weights.map((w) => (total * w) / sum), out = exact.map(Math.floor);
	const order = exact.map((v, k) => ({ k, r: v - out[k] })).sort((a, b) => b.r - a.r || a.k - b.k);
	for (let j = 0, left = total - out.reduce((a, v) => a + v, 0); j < left; j++) out[order[j % order.length].k]++;
	return out;
}

// Who shares an item (x, skipping people past n, who've been removed), where they are in it.s, their weight and pennies
export function itemShares(it: Item, n: number) {
	const s = it.s.map((x, at) => ({ x, at, w: it.w?.[at] ?? 1 })).filter((v) => v.x < n);
	const pence = allocate(Math.round(it.a * 100), s.map((v) => v.w));
	return s.map((v, k) => ({ ...v, pence: pence[k] }));
}

const VULGAR: Record<string, string> = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

// A weight's share of the total as a simple fraction (⅔, 3/7), or a % when the fraction isn't simple
export function portion(w: number, sum: number) {
	if (!sum || w >= sum) return 'all';
	const g = gcd(w, sum), f = `${w / g}/${sum / g}`;
	return sum / g <= 12 ? (VULGAR[f] ?? f) : `${Math.round((100 * w) / sum)}%`;
}

export function calc(b: Bill) {
	const n = b.p.length;
	const own = b.p.map(() => 0);
	let un = 0, sub = 0;
	for (const it of b.i) {
		const c = Math.round(it.a * 100), s = itemShares(it, n);
		sub += c;
		if (!s.length) un += c;
		for (const v of s) own[v.x] += v.pence;
	}
	const svc = sub > 0 ? Math.round(b.sm ? b.sc * 100 : (sub * b.sc) / 100) : 0;
	// While anything's unassigned everyone's share is rounded down, so it depends only on what they ordered and the
	// leftover pennies wait in unSvc; once it's all assigned they're handed out as usual (only ever adding a penny)
	const svcBy = un ? own.map((o) => Math.floor((svc * o) / sub)) : allocate(svc, own);
	const unSvc = svc - svcBy.reduce((a, v) => a + v, 0);
	const tot = own.map((o, k) => o + svcBy[k]);
	return { own, svcBy, tot, sub, un, unSvc, svc, total: sub + svc };
}
