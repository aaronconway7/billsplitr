import { toast } from 'svelte-sonner';
import { emptyBill, type Bill } from './bill.ts';
import { curDec, curMeta, curOk, money } from './currencies.ts';
import type { Receipt } from './scan.ts';
import { calc } from './split.ts';

// mode: 'local' (bill only in this browser, or a legacy #hash link), 'edit' (/e/<editId>), 'view' (/<viewId>)
export const app = $state({
	bill: emptyBill(),
	ro: false,
	mode: 'local' as 'local' | 'edit' | 'view',
	view: null as string | null,
	edit: null as string | null,
	// The Allow editing switch: picks which link the copy buttons share
	canEdit: false,
	saveStatus: '',
	ready: false
});

const split = $derived(calc(app.bill));
// Who owes what for the current bill, in pence
export const currentSplit = () => split;

export const snapshot = () => $state.snapshot(app.bill) as Bill;

// Editing actions do nothing on a read-only bill (its controls are hidden, so this is a safety net)
function readOnly() {
	if (app.ro) toast('This shared bill is read-only');
	return app.ro;
}

export function addPerson(name: string) {
	const v = name.trim();
	if (readOnly() || !v) return false;
	app.bill.p.push(v);
	return true;
}

// People are referenced by position, so shares and the payer shift down past the removed person
export function removePerson(k: number) {
	if (readOnly()) return;
	const b = app.bill;
	b.p.splice(k, 1);
	for (const it of b.i) it.s = it.s.filter((x) => x !== k).map((x) => (x > k ? x - 1 : x));
	if (b.pd === k) b.pd = -1;
	else if (b.pd > k) b.pd--;
}

export function addItem(name: string, amount: number | null | undefined) {
	if (readOnly()) return false;
	const n = name.trim();
	if (!n || amount == null || !(amount >= 0)) {
		toast('Enter a name and price');
		return false;
	}
	app.bill.i.push({ n, a: amount, s: [] });
	return true;
}

// Blank names are ignored
export function renamePerson(k: number, name: string) {
	const v = name.trim();
	if (!readOnly() && v) app.bill.p[k] = v;
}

// Leaves a field alone if it's blank (name) or not a valid price
export function updateItem(j: number, { n, a }: { n?: string; a?: number | null }) {
	if (readOnly()) return;
	const it = app.bill.i[j];
	if (n?.trim()) it.n = n.trim();
	if (a != null && a >= 0) it.a = a;
}

export function removeItem(j: number) {
	if (!readOnly()) app.bill.i.splice(j, 1);
}

export function toggleShare(j: number, k: number) {
	if (readOnly()) return;
	const s = app.bill.i[j].s, at = s.indexOf(k);
	if (at > -1) s.splice(at, 1);
	else s.push(k);
}

export function assignAll(j: number) {
	if (!readOnly()) app.bill.i[j].s = app.bill.p.map((_, k) => k);
}

// A % (fixed false) or an amount. Anything negative, not a number or over 100% means no service
export function setService(v: number, fixed = false) {
	if (readOnly()) return;
	const b = app.bill;
	b.sc = v >= 0 && (fixed || v <= 100) ? v : 0;
	if (fixed && b.sc) b.sm = 1;
	else delete b.sm;
}

export function togglePayer(k: number) {
	if (!readOnly()) app.bill.pd = app.bill.pd === k ? -1 : k;
}

export function setCurrency(c: string) {
	if (!readOnly() && curOk(c)) app.bill.c = c;
}

// Adds a scanned receipt's items to the bill and says what happened, for a toast.
// Takes its currency only for a bill with no items yet, and its service (plus any sales tax on top,
// as one fixed amount) only if none is set. Discounts are left out, since items can't be negative
export function addScanned(r: Receipt) {
	if (readOnly()) return '';
	const b = app.bill;
	const fresh = !b.i.length;
	if (fresh && r.currency) setCurrency(r.currency);
	let sum = 0, off = 0, added = 0;
	for (const { name, qty, price } of r.items) {
		sum += price;
		if (price < 0) off -= price;
		else {
			b.i.push({ n: (qty > 1 ? `${qty} × ${name}` : name).slice(0, 40), a: price, s: [] });
			added++;
		}
	}
	const svc = r.service?.percent != null ? (sum * r.service.percent) / 100 : (r.service?.amount ?? 0);
	if (!b.sc && (svc || r.tax)) {
		if (r.service?.percent != null && !r.tax) setService(r.service.percent);
		else setService(Math.round((svc + (r.tax ?? 0)) * 100) / 100, true);
	}
	if (!added) return "Couldn't find any items on that receipt";
	const p = (v: number) => money(Math.round(v * 100), b.c);
	let msg = `Added ${added} item${added > 1 ? 's' : ''}`;
	if (off) msg += `, leaving out ${p(off)} of discounts`;
	// The model can misread or miss a line, so point out when the receipt's own total disagrees
	// by at least one of the currency's smallest units (receipts round the service to them)
	const got = sum + svc + (r.tax ?? 0);
	if (r.total != null && Math.abs(got - r.total) >= 0.5 / 10 ** curDec(curMeta(b.c))) msg += `. Check them: the receipt says ${p(r.total)}, these come to ${p(got)}`;
	return msg;
}
