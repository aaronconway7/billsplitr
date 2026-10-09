<script lang="ts">
	import CameraIcon from '@lucide/svelte/icons/camera';
	import LoaderIcon from '@lucide/svelte/icons/loader-circle';
	import { toast } from 'svelte-sonner';
	import { Button } from '#lib/components/ui/button/index.js';
	import { addScanned } from '#lib/editor.svelte.ts';
	import { ScanError, scanReceipt } from '#lib/scan.ts';

	let photo = $state<HTMLInputElement | null>(null);
	let scanning = $state(false);
	// Longer than the app's usual toasts: the camera or photo picker has only just closed
	const duration = 6000;

	// Fills in the items, and the currency and service if they aren't set, from a receipt photo
	async function scan(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		e.currentTarget.value = '';
		if (!file) return;
		scanning = true;
		const id = toast.loading('Reading the receipt…', { description: 'The photo is sent to Google Gemini to read' });
		try {
			const msg = addScanned(await scanReceipt(file));
			if (msg) toast.success(msg, { id, description: undefined, duration });
			else toast.dismiss(id);
		} catch (err) {
			toast.error(err instanceof ScanError ? err.message : "Couldn't read that receipt", { id, description: undefined, duration });
		} finally {
			scanning = false;
		}
	}
</script>

<!-- Just the icon on small phones, where the header is tight -->
<Button variant="outline" size="sm" aria-label="Scan a receipt" title="Scan a receipt" class="max-[480px]:w-8 max-[480px]:px-0" disabled={scanning} onclick={() => photo?.click()}>
	{#if scanning}<LoaderIcon class="animate-spin" />{:else}<CameraIcon />{/if}
	<span class="max-[480px]:hidden">Scan receipt</span>
</Button>
<input bind:this={photo} type="file" accept="image/*" class="hidden" aria-label="Receipt photo" onchange={scan} />
