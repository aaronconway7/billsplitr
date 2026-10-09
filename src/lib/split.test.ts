import { describe, expect, it } from 'vitest';
import type { Bill } from './bill.ts';
import { money } from './currencies.ts';
import { calc } from './split.ts';

const bill = (b: Partial<Bill>): Bill => ({ p: ['A', 'B', 'C'], i: [], sc: 0, pd: -1, c: 'GBP', ...b });

describe('calc', () => {
	it('gives leftover pennies to the first sharers', () => {
		const c = calc(bill({ i: [{ n: 'x', a: 10, s: [0, 1, 2] }] }));
		expect(c.own).toEqual([334, 333, 333]);
		expect(c.tot).toEqual([334, 333, 333]);
	});

	it('shares service by what each person ordered, rounding into the top spender', () => {
		const c = calc(bill({ sc: 12.5, i: [{ n: 'x', a: 10, s: [0] }, { n: 'y', a: 3.33, s: [1] }, { n: 'z', a: 3.33, s: [2] }] }));
		expect(c.svc).toBe(208);
		expect(c.tot.reduce((a, v) => a + v, 0)).toBe(c.sub + c.svc);
		expect(c.tot).toEqual([1124, 375, 375]);
	});

	it('counts unassigned items, and items shared with removed people', () => {
		const c = calc(bill({ sc: 10, i: [{ n: 'x', a: 5, s: [] }, { n: 'y', a: 2, s: [7] }] }));
		expect(c).toMatchObject({ un: 700, sub: 700, svc: 0, tot: [0, 0, 0] });
	});
});

describe('money', () => {
	it('uses the currency’s decimals', () => {
		expect(money(1234, 'GBP')).toBe('£12.34');
		expect(money(1234, 'JPY')).toBe('¥12');
		expect(money(1234, 'KWD')).toBe('KD12.340');
		expect(money(1234, 'XXX')).toBe('£12.34');
	});
});
