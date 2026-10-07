import { bills, edits, readBill } from '../lib/bills.mjs';

// Save a new shared bill and return its read-only and edit ids
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const d = await readBill(req);
  if (!d) return new Response('Bad payload', { status: 400 });
  const viewId = crypto.randomUUID();
  const editId = crypto.randomUUID();
  await bills().setJSON(viewId, { d, updated: Date.now(), editId });
  await edits().set(editId, viewId);
  return Response.json({ viewId, editId });
};

// Netlify rejects excess requests with 429 before invoking; the client then falls back to the long link
export const config = {
  path: '/api/bills',
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
