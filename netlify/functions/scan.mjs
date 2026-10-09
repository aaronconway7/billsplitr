import { cleanReceipt, MODEL, PROMPT, SCHEMA } from '../lib/receipt.mjs';

// The client shrinks photos to a few hundred KB, so anything near this is not one of ours
const MAX = 4_000_000;
const MIME = /^image\/(jpeg|png|webp)$/;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

// Read the items off a receipt photo: { image: base64, mime } -> cleanReceipt's result
// 429 when Gemini's free quota is used up, 504 when it's too slow, 502 for anything else it gets wrong
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return new Response('Scanning is not set up', { status: 503 });
  const text = await req.text();
  if (text.length > MAX) return new Response('Too large', { status: 413 });
  let image, mime;
  try { ({ image, mime } = JSON.parse(text)); } catch { /* checked below */ }
  if (typeof image !== 'string' || !B64.test(image) || !MIME.test(mime ?? '')) return new Response('Bad payload', { status: 400 });

  let r;
  try {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType: mime, data: image } }, { text: PROMPT }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
          temperature: 0,
          // Reading a receipt doesn't need much thought, and functions time out after 10s
          thinkingConfig: { thinkingLevel: 'low' },
        },
      }),
      signal: AbortSignal.timeout(9000),
    });
  } catch (e) {
    return new Response('Scan failed', { status: e?.name === 'TimeoutError' ? 504 : 502 });
  }
  if (r.status === 429) return new Response('Out of scans for now', { status: 429 });
  if (!r.ok) {
    console.error('Gemini', r.status, await r.text());
    return new Response('Scan failed', { status: 502 });
  }
  try {
    const out = await r.json();
    return Response.json(cleanReceipt(JSON.parse(out.candidates[0].content.parts.find((p) => p.text && !p.thought).text)));
  } catch {
    return new Response('Scan failed', { status: 502 });
  }
};

export const config = {
  path: '/api/scan',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
