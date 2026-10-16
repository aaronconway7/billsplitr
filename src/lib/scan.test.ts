import { beforeEach, describe, expect, it } from 'vitest';
import { cleanReceipt, quotaReset } from '../../netlify/lib/receipt.mjs';
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

	// La Fabrica, Alicante: Precio and Importe columns, read as 4 × Croquetas at 9.50 instead of 38.00
	it('uses qty × unit price when that matches the total and the prices as read don’t', () => {
		const items = [
			{ name: 'Agua', qty: 1, unitPrice: 2.5, price: 2.5 },
			{ name: 'Croquetas', qty: 4, unitPrice: 9.5, price: 9.5 },
			{ name: 'Patatas bravas', qty: 2, unitPrice: 7.5, price: 7.5 }
		];
		expect(cleanReceipt({ items, total: 55.5 }).items.map((it) => it.price)).toEqual([2.5, 38, 15]);
		// With a 10% service on top
		expect(cleanReceipt({ items, service: { percent: 10 }, total: 61.05 }).items.map((it) => it.price)).toEqual([2.5, 38, 15]);
		// Left alone when the prices as read already add up, or there's no total to check against
		expect(cleanReceipt({ items, total: 19.5 }).items.map((it) => it.price)).toEqual([2.5, 9.5, 7.5]);
		expect(cleanReceipt({ items }).items.map((it) => it.price)).toEqual([2.5, 9.5, 7.5]);
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

describe('quotaReset', () => {
	const err = (quotaId: string, retryDelay?: string) => ({
		error: {
			code: 429,
			details: [
				{ '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId }] },
				...(retryDelay ? [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay }] : [])
			]
		}
	});

	it('resets a used-up daily quota at midnight Pacific time', () => {
		// 15:00 UTC in October is 08:00 in California, so 16 hours to go
		const now = Date.UTC(2026, 9, 9, 15, 0, 0);
		expect(quotaReset(err('GenerateRequestsPerDayPerProjectPerModel-FreeTier', '20s'), now)).toEqual({ why: 'day', until: Date.UTC(2026, 9, 10, 7, 0, 0) });
	});

	it('resets a per-minute quota when Gemini says', () => {
		expect(quotaReset(err('GenerateRequestsPerMinutePerProjectPerModel-FreeTier', '37.4s'), 0)).toEqual({ why: 'minute', until: 38000 });
		expect(quotaReset(err('GenerateContentInputTokensPerModelPerMinute-FreeTier'), 0)).toEqual({ why: 'minute', until: 60000 });
		expect(quotaReset(null, 0)).toEqual({ why: 'minute', until: 60000 });
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

	it("doesn't flag a total that only differs by the receipt's rounding", () => {
		const msg = addScanned({ items: [{ name: 'Ramen', qty: 1, price: 1234 }], service: { percent: 10 }, total: 1357, currency: 'JPY' });
		expect(msg).toBe('Added 1 item');
	});

	it('says when it found nothing', () => {
		expect(addScanned({ items: [] })).toBe("Couldn't find any items on that receipt");
	});
});
