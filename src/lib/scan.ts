// Sending a receipt photo to /api/scan (netlify/functions/scan.mjs), which reads its items with Gemini
export type Receipt = {
	items: { name: string; qty: number; price: number }[];
	service?: { percent?: number; amount?: number };
	// Sales tax added on top of the prices; VAT-inclusive receipts leave it out
	tax?: number;
	total?: number;
	currency?: string;
};

// What the user is told when a scan fails, by status
const FAIL: Record<number, string> = {
	404: "Receipt scanning isn't set up here",
	503: "Receipt scanning isn't set up here",
	504: 'The receipt took too long to read, try again'
};
export class ScanError extends Error {}

// Gemini's free quota ran out for the day or the minute; until is when it resets
function quotaMessage(q: { why?: string; until?: number } | null) {
	if (q?.why !== 'day' || !q.until) return 'Too many receipt scans just now, try again in a minute';
	const at = new Date(q.until), time = at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	const day = at.toDateString() === new Date().toDateString() ? '' : 'tomorrow ';
	return `Out of free receipt scans for today. They're back ${day}at ${time}`;
}

// Phone photos are several MB; a long edge of 1600px keeps receipt text readable at a few hundred KB
const EDGE = 1600;
async function shrink(file: Blob) {
	const img = await createImageBitmap(file);
	const k = Math.min(1, EDGE / Math.max(img.width, img.height));
	const c = document.createElement('canvas');
	c.width = Math.round(img.width * k);
	c.height = Math.round(img.height * k);
	c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
	img.close();
	return c.toDataURL('image/jpeg', 0.8).split(',')[1];
}

// Reading a photo takes a second or two, but the function gives Gemini up to 25s, so this allows longer than api()'s 5s
export async function scanReceipt(file: Blob): Promise<Receipt> {
	let image: string;
	try {
		image = await shrink(file);
	} catch {
		throw new ScanError("Couldn't open that image");
	}
	let r: Response;
	try {
		r = await fetch('/api/scan', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ image, mime: 'image/jpeg' }),
			signal: AbortSignal.timeout(35000)
		});
	} catch {
		throw new ScanError("Couldn't reach the scanner, check your connection");
	}
	// Netlify's own per-visitor rate limit has no body, so counts as a minute
	if (r.status === 429) throw new ScanError(quotaMessage(await r.json().catch(() => null)));
	if (!r.ok) throw new ScanError(FAIL[r.status] ?? "Couldn't read that receipt");
	return r.json();
}
