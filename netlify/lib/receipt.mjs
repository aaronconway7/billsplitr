// Reading a receipt photo with Gemini (netlify/functions/scan.mjs), on the free tier.
// Flash-Lite reads receipts as well as Flash in a second or two, and its free tier allows far more
// requests (the newest Flash allowed 5 a minute and 20 a day, and took up to 30s when busy).
// GEMINI_MODEL overrides it, since Google renames models often

export const MODEL = 'gemini-3.5-flash-lite';

export const PROMPT = `This is a photo of a restaurant or shop receipt. List what was bought so a group can split it.
- items: one entry per printed line item, in order. name as printed (expand obvious abbreviations), qty (1 if not shown) and price, the line's total in the receipt's currency.
- Leave out subtotal, total, tax/VAT, tips already paid, payment, change and card lines.
- Put a discount or voucher in as an item with a negative price.
- service: a service charge or gratuity added to the bill, as percent if one is printed, otherwise amount. Leave it out if there isn't one.
- tax: sales tax added on top of the item prices (as on US receipts). Leave it out when the prices already include it, as with VAT.
- total: the final amount due, if printed.
- currency: the ISO 4217 code, from the symbol, language or address.
If the photo isn't a receipt, return an empty items list.`;

// The OpenAPI subset generateContent's responseSchema takes
export const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, qty: { type: 'number' }, price: { type: 'number' } },
        required: ['name', 'price'],
      },
    },
    service: { type: 'object', properties: { percent: { type: 'number' }, amount: { type: 'number' } } },
    tax: { type: 'number' },
    total: { type: 'number' },
    currency: { type: 'string' },
  },
  required: ['items'],
};

const MAX_ITEMS = 100;
const num = (/** @type {any} */ v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null);
const pos = (/** @type {any} */ v) => (num(v) != null && v > 0 ? num(v) : undefined);

// What the client gets: { items: [{ name, qty, price }], service?: { percent? | amount? }, tax?, total?, currency? }
// Names fit the 40-character item field; discounts keep their negative price so the client can report them
/** @param {any} raw @returns {import('../../src/lib/scan.ts').Receipt} */
export function cleanReceipt(raw) {
  const items = [];
  for (const it of Array.isArray(raw?.items) ? raw.items : []) {
    const name = typeof it?.name === 'string' ? it.name.replace(/\s+/g, ' ').trim().slice(0, 40).trim() : '';
    const price = num(it?.price);
    if (!name || price == null) continue;
    const qty = Number.isInteger(it.qty) && it.qty > 1 && it.qty < 1000 ? it.qty : 1;
    items.push({ name, qty, price });
    if (items.length === MAX_ITEMS) break;
  }
  /** @type {import('../../src/lib/scan.ts').Receipt} */
  const out = { items };
  const percent = pos(raw?.service?.percent), amount = pos(raw?.service?.amount);
  if (percent != null && percent <= 100) out.service = { percent };
  else if (amount != null) out.service = { amount };
  const tax = pos(raw?.tax), total = pos(raw?.total);
  if (tax != null) out.tax = tax;
  if (total != null) out.total = total;
  if (typeof raw?.currency === 'string' && /^[A-Z]{3}$/.test(raw.currency.trim().toUpperCase())) out.currency = raw.currency.trim().toUpperCase();
  return out;
}

// Gemini's 429s say which free-tier limit ran out (a quotaId like GenerateRequestsPerDayPerProjectPerModel-FreeTier)
// and, for per-minute ones, how long to wait. Daily limits reset at midnight Pacific time.
// Returns { why: 'day' | 'minute', until: ms timestamp }
export function quotaBlock(/** @type {any} */ err, now = Date.now()) {
  const details = Array.isArray(err?.error?.details) ? err.error.details : [];
  const ids = details.flatMap((/** @type {any} */ d) => d?.violations ?? []).map((/** @type {any} */ v) => String(v?.quotaId ?? ''));
  if (ids.some((/** @type {string} */ id) => /PerDay/i.test(id))) return { why: 'day', until: now + msToPacificMidnight(now) };
  const delay = details.map((/** @type {any} */ d) => /^(\d+(?:\.\d+)?)s$/.exec(d?.retryDelay ?? '')).find(Boolean);
  return { why: 'minute', until: now + Math.min(Math.max(delay ? Math.ceil(+delay[1]) : 60, 5), 120) * 1000 };
}

function msToPacificMidnight(/** @type {number} */ now) {
  const t = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hourCycle: 'h23', hour: 'numeric', minute: 'numeric', second: 'numeric' })
      .formatToParts(now).map((p) => [p.type, +p.value])
  );
  return 864e5 - ((t.hour * 60 + t.minute) * 60 + t.second) * 1000;
}
