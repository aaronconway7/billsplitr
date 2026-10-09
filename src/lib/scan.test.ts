import { beforeEach, describe, expect, it } from 'vitest';
import { cleanReceipt } from '../../netlify/lib/receipt.mjs';
import { emptyBill } from './bill.ts';
import { addScanned, app } from './editor.svelte.ts';

describe('cleanReceipt', () => {
	it('keeps good lines and drops ones without a name or price', () => {
		const r = cleanReceipt({
			items: [
				{ name: '  Margherita   pizza ', qty: 1, price: 12.5 },
				{ name: '', price: 3 },
				{ name: 'Beer', qty: 2, price: 9 },
				{ name: 'Nothing', price: 'free' },
				{ name: 'Voucher', price: -5 },
				{ name: 'x'.repeat(60), qty: 2.5, price: 1 }
			]
		});
		expect(r.items).toEqual([
			{ name: 'Margherita pizza', qty: 1, price: 12.5 },
			{ name: 'Beer', qty: 2, price: 9 },
			{ name: 'Voucher', qty: 1, price: -5 },
			{ name: 'x'.repeat(40), qty: 1, price: 1 }
		]);
	});

	it('caps the number of items', () => {
		expect(cleanReceipt({ items: Array.from({ length: 150 }, () => ({ name: 'a', price: 1 })) }).items).toHaveLength(100);
	});

	it('keeps a sensible service, tax, total and currency', () => {
		expect(cleanReceipt({ items: [], service: { percent: 12.5, amount: 5 }, tax: 2, total: 50, currency: ' eur ' })).toEqual({
			items: [],
			service: { percent: 12.5 },
			tax: 2,
			total: 50,
			currency: 'EUR'
		});
		expect(cleanReceipt({ items: [], service: { percent: 150, amount: 5 } }).service).toEqual({ amount: 5 });
		expect(cleanReceipt({ service: { amount: -1 }, tax: 0, total: 'lots', currency: 'Euro' })).toEqual({ items: [] });
		expect(cleanReceipt(null)).toEqual({ items: [] });
	});
});

describe('addScanned', () => {
	beforeEach(() => {
		app.bill = emptyBill();
		app.ro = false;
	});

	it('adds items, the currency and a % service to a new bill', () => {
		const msg = addScanned({
			items: [{ name: 'Pizza', qty: 1, price: 12 }, { name: 'Beer', qty: 2, price: 9 }],
			service: { percent: 12.5 },
			total: 23.63,
			currency: 'EUR'
		});
		expect(app.bill.i).toEqual([{ n: 'Pizza', a: 12, s: [] }, { n: '2 × Beer', a: 9, s: [] }]);
		expect(app.bill).toMatchObject({ c: 'EUR', sc: 12.5 });
		expect(app.bill.sm).toBeUndefined();
		expect(msg).toBe('Added 2 items');
	});

	it('adds to existing items without changing the currency or service', () => {
		app.bill.i.push({ n: 'Bread', a: 4, s: [0] });
		app.bill.sc = 10;
		addScanned({ items: [{ name: 'Wine', qty: 1, price: 30 }], service: { amount: 5 }, currency: 'USD' });
		expect(app.bill.i.map((it) => it.n)).toEqual(['Bread', 'Wine']);
		expect(app.bill).toMatchObject({ c: 'GBP', sc: 10 });
	});

	it('folds sales tax into a fixed service', () => {
		addScanned({ items: [{ name: 'Burger', qty: 1, price: 20 }], service: { percent: 10 }, tax: 1.75, total: 23.75, currency: 'USD' });
		expect(app.bill).toMatchObject({ sc: 3.75, sm: 1 });
	});

	it('leaves out discounts and flags a total that disagrees', () => {
		const msg = addScanned({ items: [{ name: 'Pasta', qty: 1, price: 15 }, { name: 'Voucher', qty: 1, price: -5 }], total: 12 });
		expect(app.bill.i).toEqual([{ n: 'Pasta', a: 15, s: [] }]);
		expect(msg).toBe('Added 1 item, leaving out £5.00 of discounts. Check them: the receipt says £12.00, these come to £10.00');
	});

	it('says when it found nothing', () => {
		expect(addScanned({ items: [] })).toBe("Couldn't find any items on that receipt");
	});
});
