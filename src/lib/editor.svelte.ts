import { toast } from 'svelte-sonner';
import { emptyBill, type Bill } from './bill.ts';
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

// Anything outside 0–100 (or not a number) means no service
export function setService(v: number) {
	if (!readOnly()) app.bill.sc = v >= 0 && v <= 100 ? v : 0;
}

export function togglePayer(k: number) {
	if (!readOnly()) app.bill.pd = app.bill.pd === k ? -1 : k;
}

export function setCurrency(c: string) {
	if (!readOnly() && curOk(c)) app.bill.c = c;
}
