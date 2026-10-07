import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const MAX = 8192;
const OK = /^[A-Za-z0-9_\-~.]+$/;

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  let d;
  try { d = (await req.json()).d; } catch { return new Response('Bad JSON', { status: 400 }); }
  if (typeof d !== 'string' || !d || d.length > MAX || !OK.test(d)) return new Response('Bad payload', { status: 400 });
  // Content-addressed id: the same bill always gets the same short link
  const id = createHash('sha256').update(d).digest('base64url').slice(0, 10);
  await getStore('links').set(id, d);
  return Response.json({ id, url: new URL('/s/' + id, req.url).href });
};

// Netlify rejects excess requests with 429 before invoking; the client then falls back to the long link
export const config = {
  path: '/api/shorten',
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
