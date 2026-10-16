import type { Bill } from './bill.ts';
import { money } from './currencies.ts';
import type { Split } from './split.ts';

// "12.5%" or, for a fixed service, "£14.63"
export const serviceLabel = (b: Bill) => (b.sm ? money(Math.round(b.sc * 100), b.c) : b.sc + '%');

// The shared summary text (chat apps like WhatsApp render *bold*), followed by the bill's link
export function summary(b: Bill, c: Split, link: string, editable: boolean) {
	const fmt = (p: number) => money(p, b.c);
	const payer = b.p[b.pd];
	let t = '🧾 *Bill split*\nTotal: *' + fmt(c.total) + '*' + (c.svc ? ' (incl. ' + serviceLabel(b) + ' service)' : '') + '\n\n';
	t += payer ? '💸 *Pay ' + payer + ':*\n' : '*Who owes what:*\n';
	b.p.forEach((p, k) => {
		if (k !== b.pd) t += '• ' + p + ' – ' + fmt(c.tot[k]) + '\n';
	});
	if (c.un) t += '\n⚠️ ' + fmt(c.un + c.unSvc) + ' not yet assigned\n';
	return (t + '\n' + (editable ? 'View or edit the split: ' : 'See the full split: ') + link).trim();
}
