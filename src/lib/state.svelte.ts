import { goto } from '$app/navigation';
import { api } from './api.ts';
import { emptyBill, type Bill } from './bill.ts';
import { dec, enc, encZ, norm } from './codec.ts';
import { curOk } from './currencies.ts';
import { toast } from 'svelte-sonner';

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

const READ_ONLY = 'This shared bill is read-only';
export const EDIT_FAIL = 'Couldn’t create an edit link. Try again in a moment.';

// Latest compressed encoding of the bill; RS discards results that finish out of order
let RS = 0, PEND: Promise<string> = Promise.resolve('');
// BASE: the encoding last saved to the server. ST: pending save timer. SQ: save queue. CR: in-flight create.
let BASE = '', ST: ReturnType<typeof setTimeout> | null = null, SQ: Promise<unknown> = Promise.resolve();
let CR: Promise<void> | null = null, SAVE_ERR = false;

const snap = () => $state.snapshot(app.bill) as Bill;
const canEdit = () => !app.ro && app.canEdit;
const setUrl = (u: string) => goto(u, { replace: true, shallow: true }).catch(() => {});
const longUrl = (h: string) => location.origin + '/#' + h;

// Edit keys this browser holds (viewId -> editId), so read-only addresses stay editable for whoever has the key
function getKeys(): Record<string, string> {
	try {
		return JSON.parse(localStorage.getItem('bsplitr-keys')!) || {};
	} catch {
		return {};
	}
}
function saveKey(v: string, e: string) {
	const k = getKeys();
	k[v] = e;
	try {
		localStorage.setItem('bsplitr-keys', JSON.stringify(k));
	} catch {}
}

// --- Editing ---

function guard() {
	if (app.ro) toast(READ_ONLY);
	return app.ro;
}

export function addPerson(name: string) {
	if (guard()) return false;
	const v = name.trim();
	if (!v) return false;
	app.bill.p.push(v);
	return true;
}

export function removePerson(k: number) {
	if (guard()) return;
	const b = app.bill;
	b.p.splice(k, 1);
	for (const it of b.i) it.s = it.s.filter((x) => x !== k).map((x) => (x > k ? x - 1 : x));
	if (b.pd === k) b.pd = -1;
	else if (b.pd > k) b.pd--;
}

export function addItem(name: string, amount: string) {
	if (guard()) return false;
	const n = name.trim(), a = parseFloat(amount);
	if (!n || !(a >= 0)) {
		toast('Enter a name and price');
		return false;
	}
	app.bill.i.push({ n, a, s: [] });
	return true;
}

export function removeItem(j: number) {
	if (!guard()) app.bill.i.splice(j, 1);
}

export function toggleShare(j: number, k: number) {
	if (guard()) return;
	const s = app.bill.i[j].s, at = s.indexOf(k);
	if (at > -1) s.splice(at, 1);
	else s.push(k);
}

export function assignAll(j: number) {
	if (!guard()) app.bill.i[j].s = app.bill.p.map((_, k) => k);
}

export function setService(v: number) {
	if (!guard()) app.bill.sc = v >= 0 && v <= 100 ? v : 0;
}

export function togglePayer(k: number) {
	if (!guard()) app.bill.pd = app.bill.pd === k ? -1 : k;
}

export function setCurrency(c: string) {
	if (!guard() && curOk(c)) app.bill.c = c;
}

// Shared links keep showing the old bill; the caller confirms first
export function reset() {
	const kept = curOk(app.bill.c) ? app.bill.c : 'GBP';
	if (ST) saveNow(true);
	app.bill = emptyBill(kept);
	Object.assign(app, { mode: 'local', ro: false, view: null, edit: null, canEdit: false, saveStatus: '' });
	CR = null;
	SAVE_ERR = false;
	setUrl('/');
}

// --- Sharing ---

// First share: store the bill on the server; this browser keeps the edit key
function create() {
	if (CR) return CR;
	const base = enc(snap());
	const me: Promise<void> = (CR = PEND.then((z) => api('POST', '/api/bills', { d: z })).then(
		(j) => {
			// A reset while this was in flight means the bill it was created for is gone
			if (CR !== me) throw new Error('superseded');
			if (!j?.viewId || !j?.editId) throw new Error('bad response');
			Object.assign(app, { view: j.viewId, edit: j.editId, mode: 'edit' });
			BASE = base;
			// The bill now lives at its link, so the home page goes back to a fresh bill
			try {
				localStorage.removeItem('bsplitr');
			} catch {}
			saveKey(j.viewId, j.editId);
		},
		(e) => {
			if (CR === me) CR = null;
			throw e;
		}
	));
	return me;
}

function viewUrl(): Promise<string> {
	if (app.view) return Promise.resolve(location.origin + '/' + app.view);
	if (app.ro) return Promise.resolve(location.href);
	return create().then(
		() => location.origin + '/' + app.view,
		() => PEND.then(longUrl)
	);
}

function editUrl(): Promise<string> {
	if (app.edit) return Promise.resolve(location.origin + '/e/' + app.edit);
	if (app.ro) return Promise.resolve('');
	return create().then(
		() => location.origin + '/e/' + app.edit,
		() => ''
	);
}

export const linkUrl = () => (canEdit() ? editUrl() : viewUrl());
export const linkIsEdit = canEdit;

// --- Saving ---

// Edits are saved shortly after they stop; saves run one at a time, last save wins on the server
function scheduleSave() {
	if (enc(snap()) === BASE && !SAVE_ERR) return;
	if (ST) clearTimeout(ST);
	ST = setTimeout(saveNow, 800);
	app.saveStatus = 'Saving…';
}

function saveNow(keep = false) {
	if (ST) clearTimeout(ST);
	ST = null;
	const s = enc(snap()), id = app.edit, p = PEND;
	if (s === BASE && !SAVE_ERR) return SQ;
	SQ = SQ.then(() => p)
		.then((z) => api('PUT', '/api/bills/' + id, { d: z }, keep))
		.then(
			() => {
				if (id !== app.edit) return;
				BASE = s;
				SAVE_ERR = false;
				if (!ST) app.saveStatus = enc(snap()) === BASE ? 'All changes saved' : 'Saving…';
			},
			() => {
				if (id !== app.edit) return;
				SAVE_ERR = true;
				app.saveStatus = 'Couldn’t save changes. They’ll retry on your next edit.';
			}
		);
	return SQ;
}

// Call during component init: keeps the encoding, server copy, localStorage and address bar in step with the bill
export function connect() {
	$effect(() => {
		if (!app.ready) return;
		const b = snap(), mode = app.mode, ro = app.ro;
		const seq = ++RS;
		PEND = encZ(b).then((z) => (seq === RS ? z : PEND));
		if (mode === 'edit') scheduleSave();
		if (mode === 'local' && !ro) {
			// Keep the address bar clean while editing a local bill (it lives in localStorage)
			if (location.hash) setUrl('/');
			try {
				localStorage.setItem('bsplitr', JSON.stringify(b));
			} catch {}
		}
	});
	// The address bar always matches what Copy link would copy
	$effect(() => {
		if (!app.ready || !app.view) return;
		const u = canEdit() && app.edit ? '/e/' + app.edit : '/' + app.view;
		if (location.pathname !== u || location.hash || location.search) setUrl(u);
	});
	$effect(() => {
		if (app.ready && app.mode === 'edit' && !app.saveStatus) app.saveStatus = 'All changes saved';
	});
}

export function flushOnHide() {
	if (ST) saveNow(true);
}

// --- Loading ---

function parse(txt: string | null) {
	try {
		const o = txt ? norm(JSON.parse(txt)) : null;
		if (o && !curOk(o.c)) o.c = 'GBP';
		return o;
	} catch {
		return null;
	}
}

// A legacy #hash link opens read-only, unless it matches this browser's own bill
async function load() {
	const h = location.hash.slice(1);
	const hs = parse(h ? await dec(h).catch(() => '') : '');
	let ls: Bill | null = null;
	try {
		ls = parse(localStorage.getItem('bsplitr'));
	} catch {}
	if (hs && ls && JSON.stringify(hs) === JSON.stringify(ls)) app.bill = ls;
	else if (hs) Object.assign(app, { bill: hs, ro: true });
	else if (ls) app.bill = ls;
}

// page.mjs embeds SHARED (the encoded bill), VIEW_ID and EDIT_ID on /<viewId> and /e/<editId>
export async function boot() {
	try {
		localStorage.removeItem('bsplitr-share'); // no longer used
	} catch {}
	// Opening an edit link keeps it in the address bar with Allow editing on; the key is remembered either way
	app.canEdit = !!window.EDIT_ID;
	if (window.SHARED && window.VIEW_ID) {
		const view = window.VIEW_ID;
		const edit = window.EDIT_ID || getKeys()[view] || null;
		if (window.EDIT_ID) saveKey(view, window.EDIT_ID);
		Object.assign(app, { view, edit, mode: edit ? 'edit' : 'view', ro: !edit });
		const o = parse(await dec(window.SHARED).catch(() => null));
		if (o) app.bill = o;
		BASE = enc(snap());
	} else await load();
	app.ready = true;
	// page.mjs sends unknown or expired links to /?expired
	if (/[?&]expired\b/.test(location.search)) {
		toast('That bill link has expired');
		setUrl('/');
	}
}
