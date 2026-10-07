import { getStore } from '@netlify/blobs';

// bills: viewId -> { d, updated, editId }   edits: editId -> viewId
// netlify/functions/expire.mjs deletes both 30 days after the last edit
// Strong consistency so a reload straight after someone's edit shows it (the default can lag up to a minute)
export const bills = () => getStore({ name: 'bills', consistency: 'strong' });
export const edits = () => getStore({ name: 'edits', consistency: 'strong' });

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Route params can be missing (e.g. when Netlify re-routes a 404), and store.get(undefined) lists the whole store
export const idParam = (context) => (ID.test(context.params?.id ?? '') ? context.params.id : null);

const MAX = 8192;
const OK = /^[A-Za-z0-9_\-~.]+$/;

// Returns the encoded bill from a JSON body, or null if it's missing or malformed
export async function readBill(req) {
  let d;
  try { d = (await req.json()).d; } catch { return null; }
  return typeof d === 'string' && d && d.length <= MAX && OK.test(d) ? d : null;
}
