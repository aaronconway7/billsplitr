import { cleanReceipt, MODEL, PROMPT, SCHEMA } from '../lib/receipt.mjs';

// The client shrinks photos to a few hundred KB, so anything near this is not one of ours
const MAX = 4_000_000;
const MIME = /^image\/(jpeg|png|webp)$/;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

// Read the items off a receipt photo: { image: base64, mime } -> cleanReceipt's result
// 429 when Gemini's free quota is used up, 504 when it's too slow, 502 (saying why) for anything else it gets wrong
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return new Response('Scanning is not set up', { status: 503 });
  const text = await req.text();
  if (text.length > MAX) return new Response('Too large', { status: 413 });
  let image, mime;
  try { ({ image, mime } = JSON.parse(text)); } catch { /* checked below */ }
  if (typeof image !== 'string' || !B64.test(image) || !MIME.test(mime ?? '')) return new Response('Bad payload', { status: 400 });

  const body = JSON.stringify({
    contents: [{ parts: [{ inlineData: { mimeType: mime, data: image } }, { text: PROMPT }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      // Gemini 3 models should keep their default temperature; lower ones can make them loop
      thinkingConfig: { thinkingLevel: 'low' },
    },
  });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || MODEL}:generateContent`;
  // Netlify drops requests after about 30s. Gemini usually answers in a second or two, and an overloaded
  // model (500/503) is worth one more try
  const end = Date.now() + 25_000;
  let r;
  for (let attempt = 0; ; attempt++) {
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body,
        signal: AbortSignal.timeout(end - Date.now()),
      });
    } catch (e) {
      console.error('Gemini', e);
      return new Response('Scan failed', { status: e?.name === 'TimeoutError' ? 504 : 502 });
    }
    if (attempt || (r.status !== 500 && r.status !== 503) || end - Date.now() < 15_000) break;
    console.error('Gemini', r.status, 'retrying');
  }
  if (r.status === 429) return new Response('Out of scans for now', { status: 429 });
  if (!r.ok) {
    console.error('Gemini', r.status, await r.text());
    return new Response(`Scan failed (Gemini ${r.status})`, { status: 502 });
  }
  const out = await r.json().catch(() => null);
  try {
    return Response.json(cleanReceipt(JSON.parse(out.candidates[0].content.parts.find((/** @type {any} */ p) => p.text && !p.thought).text)));
  } catch {
    console.error('Gemini gave no readable JSON', JSON.stringify(out).slice(0, 2000));
    return new Response(`Scan failed (${out?.candidates?.[0]?.finishReason ?? 'no answer'})`, { status: 502 });
  }
};

export const config = {
  path: '/api/scan',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
