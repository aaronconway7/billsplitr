import { bills, edits, idParam, readBill } from '../lib/bills.mjs';

// Overwrite a shared bill; only the edit id can do this (last save wins)
export default async (req, context) => {
  if (req.method !== 'PUT') return new Response('Method not allowed', { status: 405 });
  const editId = idParam(context);
  const viewId = editId && await edits().get(editId);
  if (!viewId) return new Response('Not found', { status: 404 });
  const d = await readBill(req);
  if (!d) return new Response('Bad payload', { status: 400 });
  // An expired bill stays gone, even if its edit entry hasn't been cleaned up yet
  if (!await bills().get(viewId)) return new Response('Not found', { status: 404 });
  await bills().setJSON(viewId, { d, updated: Date.now(), editId });
  return new Response(null, { status: 204 });
};

// Edits are saved about a second after each change, so allow more than bill creation
export const config = {
  path: '/api/bills/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
