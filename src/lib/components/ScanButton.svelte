<script lang="ts">
	import CameraIcon from '@lucide/svelte/icons/camera';
	import LoaderIcon from '@lucide/svelte/icons/loader-circle';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { addScanned } from '#lib/editor.svelte.ts';
	import { blockMessage, ScanError, scanReceipt, scanStatus, type Block } from '#lib/scan.ts';

	let photo = $state<HTMLInputElement | null>(null);
	let scanning = $state(false);
	// Set while Gemini's free quota is used up, so the button says why instead of failing
	let block = $state<Block | null>(null);
	// Longer than the app's usual toasts: the camera or photo picker has only just closed
	const duration = 6000;

	onMount(async () => {
		block = await scanStatus();
	});
	// Comes back on its own when the quota resets
	$effect(() => {
		if (!block?.until) return;
		const t = setTimeout(() => (block = null), Math.max(0, block.until - Date.now()));
		return () => clearTimeout(t);
	});

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
			if (err instanceof ScanError && err.block) block = err.block;
			toast.error(err instanceof ScanError ? err.message : "Couldn't read that receipt", { id, description: undefined, duration });
		} finally {
			scanning = false;
		}
	}
	// Tooltips don't show on a tap, so a blocked button says why in a toast
	const onclick = () => (block ? toast(blockMessage(block), { duration }) : photo?.click());
</script>

<Tooltip.Provider delayDuration={200}>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<!-- Just the icon on small phones, where the header is tight -->
				<Button {...props} variant="outline" size="sm" aria-label="Scan a receipt" aria-disabled={!!block} disabled={scanning} class={block ? 'opacity-50' : ''} {onclick}>
					{#if scanning}<LoaderIcon class="animate-spin" />{:else}<CameraIcon />{/if}
					<span class="max-[480px]:hidden">Scan receipt</span>
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content class="max-w-64 text-center">{block ? blockMessage(block) : 'Fill in the bill from a photo of the receipt'}</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
<input bind:this={photo} type="file" accept="image/*" class="hidden" aria-label="Receipt photo" onchange={scan} />
