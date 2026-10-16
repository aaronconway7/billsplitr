import { toast } from 'svelte-sonner';
import { emptyBill, MAX_W, type Bill, type Item } from './bill.ts';
import { curOk } from './currencies.ts';
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
	for (const it of b.i) {
		const at = it.s.indexOf(k);
		if (at > -1) unshare(it, at);
		it.s = it.s.map((x) => (x > k ? x - 1 : x));
	}
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

// Weights line up with sharers; an item left with fewer than two sharers goes back to an even split
function unshare(it: Item, at: number) {
	it.s.splice(at, 1);
	it.w?.splice(at, 1);
	if (it.s.length < 2) delete it.w;
}

export function toggleShare(j: number, k: number) {
	if (readOnly()) return;
	const it = app.bill.i[j], at = it.s.indexOf(k);
	if (at > -1) return unshare(it, at);
	it.s.push(k);
	it.w?.push(1);
}

// Newcomers get one share; anyone already sharing keeps theirs
export function assignAll(j: number) {
	if (readOnly()) return;
	const it = app.bill.i[j], w = it.w;
	const s = app.bill.p.map((_, k) => k);
	if (w) it.w = s.map((k) => w[it.s.indexOf(k)] ?? 1);
	it.s = s;
}

// Uneven items have a weight per sharer, all starting at one share
export function setUneven(j: number, on: boolean) {
	if (readOnly()) return;
	const it = app.bill.i[j];
	if (on) it.w = it.s.map(() => 1);
	else delete it.w;
}

// One more or one fewer share for a sharer of an uneven item
export function stepShare(j: number, at: number, d: 1 | -1) {
	const w = app.bill.i[j].w;
	if (!readOnly() && w) w[at] = Math.min(MAX_W, Math.max(1, w[at] + d));
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
