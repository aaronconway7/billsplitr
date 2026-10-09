import type { Bill } from './bill.ts';

// Everything in pence. Shared items split evenly, with leftover pennies going to the first sharers;
// service is shared in proportion to what each person ordered, with any rounding difference going to the top spender.
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
		const each = Math.floor(c / s.length), r = c - each * s.length;
		s.forEach((x, k) => (own[x] += each + (k < r ? 1 : 0)));
	}
	const as = own.reduce((a, v) => a + v, 0);
	const svc = Math.round((as * b.sc) / 100);
	const tot = own.slice();
	if (as > 0) {
		let al = 0;
		own.forEach((o, k) => {
			const v = Math.round((svc * o) / as);
			tot[k] += v;
			al += v;
		});
		tot[own.indexOf(Math.max(...own))] += svc - al;
	}
	return { own, tot, sub, un, svc: as > 0 ? svc : 0 };
}
