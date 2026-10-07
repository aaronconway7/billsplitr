import { getStore } from '@netlify/blobs';
import { bills, edits } from '../lib/bills.mjs';

// Daily clean-up: delete shared bills (and their edit links) 30 days after the last edit.
// EXPIRE_DAYS overrides the window, for testing only. Anything that isn't a positive number
// falls back to 30, since a NaN or 0 cutoff would delete every bill.
const DAYS = Number(process.env.EXPIRE_DAYS) > 0 ? Number(process.env.EXPIRE_DAYS) : 30;
// Short links from the first version; nothing reads them any more
const links = () => getStore('links');
// Scheduled functions get 30 seconds, so read and delete in small parallel batches
const BATCH = 20;

async function inBatches(items, fn) {
  for (let i = 0; i < items.length; i += BATCH) await Promise.all(items.slice(i, i + BATCH).map(fn));
}

const keys = async (store) => (await store.list()).blobs.map((b) => b.key);

export default async () => {
  const cutoff = Date.now() - DAYS * 864e5;
  const b = bills(), e = edits(), l = links();
  const live = new Set();
  let billsGone = 0, editsGone = 0, legacy = false;

  await inBatches(await keys(b), async (viewId) => {
    const bill = await b.get(viewId, { type: 'json' });
    if (!bill) return;
    if (!bill.editId) legacy = true;
    if (bill.updated > cutoff) return live.add(viewId);
    await b.delete(viewId);
    billsGone++;
    if (bill.editId) { await e.delete(bill.editId); editsGone++; }
  });

  // Bills from before editId was stored: find their edit links by scanning. Also catches half-finished deletes.
  // Once every pre-editId bill has expired this finds nothing and can be removed.
  if (legacy) {
    await inBatches(await keys(e), async (editId) => {
      const viewId = await e.get(editId);
      if (viewId && live.has(viewId)) return;
      // Not seen above: re-check, in case the bill was created during this run
      if (viewId && await b.get(viewId)) return;
      await e.delete(editId);
      editsGone++;
    });
  }

  const old = await keys(l);
  await inBatches(old, (k) => l.delete(k));

  console.log(`expire: ${billsGone} bills, ${editsGone} edit links, ${old.length} old links deleted (${live.size} bills kept)`);
};

export const config = { schedule: '@daily' };
