import { describe, expect, it } from 'vitest';
import type { Bill } from './bill.ts';
import { b64e, dec, enc, encZ, norm, parseBill } from './codec.ts';

const bill: Bill = {
	p: ['Ann', 'Bob', 'Zoë'],
	i: [
		{ n: 'Pizza 🍕', a: 12.5, s: [0, 1] },
		{ n: 'Wine', a: 30, s: [0, 1, 2] },
		{ n: 'Bread', a: 4.99, s: [] }
	],
	sc: 12.5,
	pd: 1,
	c: 'EUR'
};

// Produced by the pre-Svelte index.html for the bill above; existing links and stored bills look like this
const LEGACY = 'W1siQW5uIiwiQm9iIiwiWm_DqyJdLFtbIlBpenphIPCfjZUiLDEyLjUsWzAsMV1dLFsiV2luZSIsMzAsWzAsMSwyXV0sWyJCcmVhZCIsNC45OSxbXV1dLDEyLjUsMSwiRVVSIl0';
const Z = 'zi45WcszLU9JRcspPApJR-YdXK8XqREcrBWRWVSUqfJjfO1VJx9BIz1Qn2kDHMBYopRSemZeqpGNsABbRMQKLORWlJqYo6ZjoWVrqRMcChcBaDHWUXEODlGIB';

const decode = async (h: string) => norm(JSON.parse(await dec(h)));

describe('codec', () => {
	it('encodes exactly as before', async () => {
		expect(enc(bill)).toBe(LEGACY);
		expect(await encZ(bill)).toBe(Z);
	});

	it('decodes links from the previous version', async () => {
		expect(await decode(LEGACY)).toEqual(bill);
		expect(await decode(Z)).toEqual(bill);
	});

	it('round-trips', async () => {
		expect(await decode(await encZ(bill))).toEqual(bill);
	});

	it('accepts the old object format', async () => {
		const old = { p: ['A', 'B'], i: [{ n: 'Tea', a: '3', s: [0, 'x', -1, 1] }], sc: '10', pd: 'no' };
		expect(await decode(b64e(JSON.stringify(old)))).toEqual({ p: ['A', 'B'], i: [{ n: 'Tea', a: 3, s: [0, 1] }], sc: 10, pd: -1, c: 'GBP' });
	});

	it('rejects anything else', () => {
		expect(norm({ p: 'nope' })).toBeNull();
		expect(norm(null)).toBeNull();
	});
});

describe('parseBill', () => {
	it('falls back to GBP for unknown currencies', () => {
		expect(parseBill(JSON.stringify({ ...bill, c: 'XXX' }))?.c).toBe('GBP');
	});

	it('returns null for anything that isn’t a bill', () => {
		expect(parseBill(null)).toBeNull();
		expect(parseBill('not json')).toBeNull();
		expect(parseBill('{"p":1}')).toBeNull();
	});
});
