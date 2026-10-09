import { toast } from 'svelte-sonner';

export function copy(txt: string, msg: string) {
	const fallback = () => {
		const a = document.createElement('textarea');
		a.value = txt;
		document.body.appendChild(a);
		a.select();
		try {
			document.execCommand('copy');
			toast(msg);
		} catch {
			toast('Copy failed');
		}
		a.remove();
	};
	if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(() => toast(msg), fallback);
	else fallback();
}

// Copy text that is still being fetched; ClipboardItem with a promise keeps Safari's user-gesture permission
export function copyP(p: Promise<string>, msg: string, fail = 'Copy failed') {
	const later = () => p.then((t) => (t ? copy(t, msg) : toast(fail)));
	if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
		try {
			const blob = p.then((t) => {
				if (!t) throw new Error('empty');
				return new Blob([t], { type: 'text/plain' });
			});
			navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]).then(() => toast(msg), later);
			return;
		} catch {}
	}
	later();
}
