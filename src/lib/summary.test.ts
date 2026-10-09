import { describe, expect, it } from 'vitest';
import type { Bill } from './bill.ts';
import { calc } from './split.ts';
import { summary } from './summary.ts';

const bill: Bill = {
	p: ['Ann', 'Bob', 'Cat'],
	i: [
		{ n: 'Pizza', a: 12.5, s: [0, 1] },
		{ n: 'Wine', a: 30, s: [0, 1, 2] },
		{ n: 'Bread', a: 4.99, s: [] }
	],
	sc: 12.5,
	pd: 1,
	c: 'GBP'
};

describe('summary', () => {
	it('tells everyone what to pay the payer', () => {
		expect(summary(bill, calc(bill), 'https://x/1', false)).toBe(
			'🧾 *Bill split*\nTotal: *£52.80* (incl. 12.5% service)\n\n💸 *Pay Bob:*\n• Ann – £18.28\n• Cat – £11.25\n\n⚠️ £4.99 not yet assigned\n\nSee the full split: https://x/1'
		);
	});

	it('lists everyone when nobody has paid, and offers the edit link', () => {
		const b = { ...bill, i: bill.i.slice(0, 2), sc: 0, pd: -1 };
		expect(summary(b, calc(b), 'https://x/e/1', true)).toBe(
			'🧾 *Bill split*\nTotal: *£42.50*\n\n*Who owes what:*\n• Ann – £16.25\n• Bob – £16.25\n• Cat – £10.00\n\nView or edit the split: https://x/e/1'
		);
	});
});
