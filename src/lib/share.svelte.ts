import { goto } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { api } from './api.ts';
import { emptyBill } from './bill.ts';
import { dec, enc, encZ, parseBill } from './codec.ts';
import { curOk } from './currencies.ts';
import { app, snapshot } from './editor.svelte.ts';
import { hush } from './motion.ts';
import { editKey, localBill, removeLegacy, saveEditKey } from './storage.ts';

export const EDIT_FAIL = 'Couldn’t create an edit link. Try again in a moment.';
const SAVE_FAIL = 'Couldn’t save changes. They’ll retry on your next edit.';

// Bookkeeping for links and saving; none of it is shown, so none of it is reactive
// The latest compressed encoding of the bill. encodeSeq lets an older, slower encoding defer to a newer one.
let encoded: Promise<string> = Promise.resolve('');
let encodeSeq = 0;
// The (uncompressed) encoding the server last saved, so unchanged bills aren't re-sent
let savedAs = '';
let saveFailed = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
// Saves run one at a time, in order
let saveQueue: Promise<void> = Promise.resolve();
// The first share in flight; a new bill while it's pending abandons it
let creating: Promise<void> | null = null;

const setUrl = (u: string) => goto(u, { replace: true, shallow: true }).catch(() => {});
const sharesEditLink = () => !app.ro && app.canEdit;

// --- Links ---

// First share: store the bill on the server; this browser keeps the edit key
function create() {
	if (creating) return creating;
	const attempt: Promise<void> = createBill(() => creating === attempt);
	creating = attempt;
	return attempt;
}

// current() is false once a new bill has abandoned this attempt
async function createBill(current: () => boolean) {
	const base = enc(snapshot());
	try {
		const j = await api('POST', '/api/bills', { d: await encoded });
		// A new bill while this was in flight means the bill it was created for is gone
		if (!current()) throw new Error('superseded');
		if (!j?.viewId || !j?.editId) throw new Error('bad response');
		Object.assign(app, { view: j.viewId, edit: j.editId, mode: 'edit' });
		savedAs = base;
		// The bill now lives at its link, so the home page goes back to a fresh bill
		localBill.clear();
		saveEditKey(j.viewId, j.editId);
	} catch (e) {
		if (current()) creating = null;
		throw e;
	}
}

// Without the server, the view link falls back to the whole bill in the hash
async function viewUrl() {
	if (app.view) return location.origin + '/' + app.view;
	if (app.ro) return location.href;
	try {
		await create();
		return location.origin + '/' + app.view;
	} catch {
		return location.origin + '/#' + (await encoded);
	}
}

// '' if there's no edit link to be had
async function editUrl() {
	if (app.edit) return location.origin + '/e/' + app.edit;
	if (app.ro) return '';
	try {
		await create();
		return location.origin + '/e/' + app.edit;
	} catch {
		return '';
	}
}

// The link the copy buttons share, which the Allow editing switch picks.
// Returned as a promise straight away, so copying keeps Safari's user-gesture permission.
export const linkUrl = () => (sharesEditLink() ? editUrl() : viewUrl());
export const linkIsEdit = sharesEditLink;

// --- Saving ---

// Edits are saved shortly after they stop; the last save wins on the server
function scheduleSave() {
	if (enc(snapshot()) === savedAs && !saveFailed) return;
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(saveNow, 800);
	app.saveStatus = 'Saving…';
}

// keepalive lets the save finish as the page goes away
function saveNow(keepalive = false) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = null;
	const base = enc(snapshot()), id = app.edit, z = encoded;
	if (base === savedAs && !saveFailed) return saveQueue;
	saveQueue = saveQueue.then(async () => {
		try {
			await api('PUT', '/api/bills/' + id, { d: await z }, keepalive);
		} catch {
			// Ignore results for a bill this page has moved on from
			if (id !== app.edit) return;
			saveFailed = true;
			app.saveStatus = SAVE_FAIL;
			return;
		}
		if (id !== app.edit) return;
		savedAs = base;
		saveFailed = false;
		if (!saveTimer) app.saveStatus = enc(snapshot()) === savedAs ? 'All changes saved' : 'Saving…';
	});
	return saveQueue;
}

export function flushOnHide() {
	if (saveTimer) saveNow(true);
}

// Call during component init: keeps the encoding, server copy, localStorage and address bar in step with the bill
export function connect() {
	$effect(() => {
		if (!app.ready) return;
		const b = snapshot(), mode = app.mode, ro = app.ro;
		const seq = ++encodeSeq;
		encoded = encZ(b).then((z) => (seq === encodeSeq ? z : encoded));
		if (mode === 'edit') scheduleSave();
		if (mode === 'local' && !ro) {
			// Keep the address bar clean while editing a local bill (it lives in localStorage)
			if (location.hash) setUrl('/');
			localBill.set(b);
		}
	});
	// The address bar always matches what Copy link would copy
	$effect(() => {
		if (!app.ready || !app.view) return;
		const u = sharesEditLink() && app.edit ? '/e/' + app.edit : '/' + app.view;
		if (location.pathname !== u || location.hash || location.search) setUrl(u);
	});
	$effect(() => {
		if (app.ready && app.mode === 'edit' && !app.saveStatus) app.saveStatus = 'All changes saved';
	});
}

// --- New bill ---

// Starts a fresh local bill in the same currency; shared links keep showing the old one. The caller confirms first.
export function newBill() {
	const kept = curOk(app.bill.c) ? app.bill.c : 'GBP';
	if (saveTimer) saveNow(true);
	hush();
	app.bill = emptyBill(kept);
	Object.assign(app, { mode: 'local', ro: false, view: null, edit: null, canEdit: false, saveStatus: '' });
	creating = null;
	saveFailed = false;
	setUrl('/');
}

// --- Loading ---

// A legacy #hash link opens read-only, unless it matches this browser's own bill
async function loadLocal() {
	const h = location.hash.slice(1);
	const fromHash = parseBill(h ? await dec(h).catch(() => '') : '');
	const local = parseBill(localBill.get());
	if (fromHash && local && JSON.stringify(fromHash) === JSON.stringify(local)) app.bill = local;
	else if (fromHash) Object.assign(app, { bill: fromHash, ro: true });
	else if (local) app.bill = local;
}

// page.mjs embeds SHARED (the encoded bill), VIEW_ID and EDIT_ID on /<viewId> and /e/<editId>
async function loadShared(shared: string, view: string) {
	// Opening an edit link remembers its key; a view link is editable if this browser already has the key
	if (window.EDIT_ID) saveEditKey(view, window.EDIT_ID);
	const edit = window.EDIT_ID || editKey(view);
	Object.assign(app, { view, edit, mode: edit ? 'edit' : 'view', ro: !edit });
	const b = parseBill(await dec(shared).catch(() => null));
	if (b) app.bill = b;
	savedAs = enc(snapshot());
}

export async function boot() {
	removeLegacy();
	// Opening an edit link keeps it in the address bar with Allow editing on
	app.canEdit = !!window.EDIT_ID;
	if (window.SHARED && window.VIEW_ID) await loadShared(window.SHARED, window.VIEW_ID);
	else await loadLocal();
	// The loaded bill just appears
	hush();
	app.ready = true;
	// page.mjs sends unknown or expired links to /?expired
	if (/[?&]expired\b/.test(location.search)) {
		toast('That bill link has expired');
		setUrl('/');
	}
}
