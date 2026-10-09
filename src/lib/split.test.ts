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

	it('shares service by what each person ordered, leftover pennies by largest remainder', () => {
		const c = calc(bill({ sc: 12.5, i: [{ n: 'x', a: 10, s: [0] }, { n: 'y', a: 3.33, s: [1] }, { n: 'z', a: 3.33, s: [2] }] }));
		expect(c.svc).toBe(208);
		expect(c.svcBy).toEqual([125, 42, 41]);
		expect(c.tot).toEqual([1125, 375, 374]);
		expect(c.total).toBe(c.sub + c.svc);
	});

	// The bill from OpenAI's GPT-6 "The Check, Please." demo, with its $8.78 tax entered as a fixed service
	it('shares a fixed service so everyone’s total adds up to the bill', () => {
		const p = ['A', 'B', 'C', 'D', 'E'];
		const c = calc({
			p,
			i: [
				{ n: 'Margherita', a: 14, s: [0] },
				{ n: 'Margherita', a: 14, s: [1] },
				{ n: 'Cacio e Pepe', a: 16, s: [2] },
				{ n: 'Rigatoni Vodka', a: 17, s: [3] },
				{ n: 'Insalata', a: 14, s: [4] },
				{ n: 'House Red (L)', a: 24, s: [0, 1, 2, 3, 4] }
			],
			sc: 8.78,
			sm: 1,
			pd: -1,
			c: 'GBP'
		});
		expect(c.svc).toBe(878);
		expect(c.svcBy).toEqual([167, 167, 184, 193, 167]);
		expect(c.tot).toEqual([2047, 2047, 2264, 2373, 2047]);
		expect(c.tot.reduce((a, v) => a + v, 0)).toBe(10778);
		expect(c.total).toBe(10778);
	});

	it('ignores a fixed service until something is assigned', () => {
		expect(calc(bill({ sc: 5, sm: 1, i: [{ n: 'x', a: 5, s: [] }] }))).toMatchObject({ svc: 0, total: 500 });
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
