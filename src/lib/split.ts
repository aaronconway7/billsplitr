import type { Bill } from './bill.ts';

// Everything in pence. Shared items split evenly; service is worked out on the whole bill and shared in proportion to what
// each person ordered, with the share for unassigned items (plus any odd pennies) held back in unSvc until they're assigned.
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

export function calc(b: Bill) {
	const n = b.p.length;
	const own = b.p.map(() => 0);
	let un = 0, sub = 0;
	for (const it of b.i) {
		const c = Math.round(it.a * 100);
		sub += c;
		const s = it.s.filter((x) => x < n);
		if (!s.length) {
			un += c;
			continue;
		}
		allocate(c, s.map(() => 1)).forEach((v, k) => (own[s[k]] += v));
	}
	const svc = sub > 0 ? Math.round(b.sm ? b.sc * 100 : (sub * b.sc) / 100) : 0;
	// While anything's unassigned everyone's share is rounded down, so it depends only on what they ordered and the
	// leftover pennies wait in unSvc; once it's all assigned they're handed out as usual (only ever adding a penny)
	const svcBy = un ? own.map((o) => Math.floor((svc * o) / sub)) : allocate(svc, own);
	const unSvc = svc - svcBy.reduce((a, v) => a + v, 0);
	const tot = own.map((o, k) => o + svcBy[k]);
	return { own, svcBy, tot, sub, un, unSvc, svc, total: sub + svc };
}
