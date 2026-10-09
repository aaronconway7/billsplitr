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
	429: 'Out of receipt scans for now, try again later',
	503: "Receipt scanning isn't set up here",
	504: 'The receipt took too long to read, try again'
};
export class ScanError extends Error {}

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

// A vision model takes a few seconds (the function allows Gemini up to 50s), so this allows longer than api()'s 5s
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
			signal: AbortSignal.timeout(60000)
		});
	} catch {
		throw new ScanError("Couldn't reach the scanner, check your connection");
	}
	if (!r.ok) throw new ScanError(FAIL[r.status] ?? "Couldn't read that receipt");
	return r.json();
}
