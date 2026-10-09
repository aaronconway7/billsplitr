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

	it('counts service before anything is assigned', () => {
		expect(calc(bill({ sc: 5, sm: 1, i: [{ n: 'x', a: 5, s: [] }] }))).toMatchObject({ svc: 500, unSvc: 500, total: 1000, tot: [0, 0, 0] });
	});

	it('counts unassigned items, and items shared with removed people', () => {
		const c = calc(bill({ sc: 10, i: [{ n: 'x', a: 5, s: [] }, { n: 'y', a: 2, s: [7] }] }));
		expect(c).toMatchObject({ un: 700, unSvc: 70, sub: 700, svc: 70, total: 770, tot: [0, 0, 0] });
	});

	it('holds back the service on unassigned items, so nobody’s share changes when they’re assigned', () => {
		const c = calc(bill({ sc: 5, sm: 1, i: [{ n: 'x', a: 30, s: [0] }, { n: 'y', a: 20, s: [] }] }));
		expect(c).toMatchObject({ svc: 500, svcBy: [300, 0, 0], unSvc: 200, tot: [3300, 0, 0], total: 5500 });
		expect(c.tot.reduce((a, v) => a + v, 0) + c.un + c.unSvc).toBe(c.total);
	});

	it('keeps everyone else’s service to the penny while items are being assigned', () => {
		const i = [{ n: 'a', a: 25.62, s: [0] }, { n: 'b', a: 13.18, s: [2] }, { n: 'c', a: 16.46, s: [2] }, { n: 'd', a: 12.43, s: [] as number[] }, { n: 'e', a: 9.99, s: [] as number[] }];
		const before = calc(bill({ sc: 12.5, i }));
		const after = calc(bill({ sc: 12.5, i: i.map((it) => (it.n === 'd' ? { ...it, s: [0] } : it)) }));
		expect(after.svcBy[2]).toBe(before.svcBy[2]);
		expect(after.tot.reduce((a, v) => a + v, 0) + after.un + after.unSvc).toBe(after.total);
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
