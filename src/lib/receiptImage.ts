import { toast } from 'svelte-sonner';
import { pack } from './codec.ts';
import { snapshot } from './editor.svelte.ts';
import { settled } from './motion.ts';
import { EDIT_FAIL } from './share.svelte.ts';

const NAME = 'billsplitr-receipt.png';

const SCALE = 2;

// The receipt on a gradient backdrop with a soft shadow, Carbon-style, as a 2× PNG
export async function receiptBlob() {
	const img = await createImageBitmap(await receiptOnly());
	const pad = 56 * SCALE;
	const cv = document.createElement('canvas');
	cv.width = img.width + pad * 2;
	cv.height = img.height + pad * 2;
	const ctx = cv.getContext('2d')!;
	const g = ctx.createLinearGradient(0, 0, cv.width, cv.height);
	g.addColorStop(0, '#0b7a5a');
	g.addColorStop(1, '#4cc9a0');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, cv.width, cv.height);
	// The shadow follows the torn edges, since they're transparent
	ctx.shadowColor = 'rgb(0 0 0 / 0.35)';
	ctx.shadowBlur = 24 * SCALE;
	ctx.shadowOffsetY = 10 * SCALE;
	ctx.drawImage(img, pad, pad);
	return new Promise<Blob>((ok, fail) => cv.toBlob((b) => (b ? ok(b) : fail(new Error('toBlob'))), 'image/png'));
}

// Just the receipt panel, without its interactive bits (marked data-capture="skip")
async function receiptOnly() {
	const el = document.getElementById('receipt');
	if (!el) throw new Error('no receipt');
	const { domToBlob } = await import('modern-screenshot');
	// A just-edited amount may still be rolling, or a row sliding
	await settled();
	// The image is sized from the panel on screen, so take off the space the skipped parts use
	let skipped = 0;
	for (const s of el.querySelectorAll<HTMLElement>('[data-capture="skip"]')) {
		const cs = getComputedStyle(s);
		skipped += s.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
	}
	return domToBlob(el, {
		scale: SCALE,
		type: 'image/png',
		height: el.getBoundingClientRect().height - skipped,
		filter: (n) => !(n instanceof HTMLElement && n.dataset.capture === 'skip')
	});
}

// Phones can hand a file to the share sheet; desktops mostly can't
export const canShareFiles = () => !!navigator.canShare?.({ files: [new File([], NAME, { type: 'image/png' })] });

// A rendered image kept for a second tap when the share sheet refused the first (iOS wants share() soon after the tap)
let ready: { key: string; blob: Blob } | null = null;

// On phones a caption can go with the image (WhatsApp sends it as the photo's caption); `again` names the button for a retry
export async function shareReceipt(caption?: Promise<string>, again = 'Share image') {
	const key = pack(snapshot());
	if (canShareFiles()) {
		const [blob, text] = await Promise.all([ready?.key === key ? ready.blob : receiptBlob(), caption]);
		// No link for the caption (the edit link needs the server): say so, but still send the image
		if (caption && !text) toast(EDIT_FAIL);
		try {
			await navigator.share({ files: [new File([blob], NAME, { type: 'image/png' })], ...(text ? { text } : {}) });
			ready = null;
		} catch (e) {
			const name = (e as Error)?.name;
			if (name === 'NotAllowedError') {
				ready = { key, blob };
				toast(`Image ready — tap ${again} again`);
			} else if (name !== 'AbortError') toast('Sharing failed');
		}
		return;
	}
	// Passing the promise straight to ClipboardItem keeps Safari's user-gesture permission
	if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
		try {
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': receiptBlob() })]);
			toast('Receipt image copied');
			return;
		} catch {}
	}
	try {
		const a = document.createElement('a');
		a.href = URL.createObjectURL(await receiptBlob());
		a.download = NAME;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
		toast('Receipt image downloaded');
	} catch {
		toast('Couldn’t make the image');
	}
}
