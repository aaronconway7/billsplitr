<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import { onMount } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { copyP } from '#lib/clipboard.ts';
	import { app, currentSplit, snapshot } from '#lib/editor.svelte.ts';
	import { EDIT_FAIL, linkIsEdit, linkUrl } from '#lib/share.svelte.ts';
	import { canShareFiles, shareReceipt } from '#lib/receiptImage.ts';
	import { summary } from '#lib/summary.ts';
	import Section from './Section.svelte';

	function copyLink() {
		copyP(linkUrl(), linkIsEdit() ? 'Edit link copied' : 'Link copied', EDIT_FAIL);
	}

	// Phones get the share sheet, desktops the clipboard; only known after mount
	let canShare = $state(false);
	onMount(() => (canShare = canShareFiles()));
	// Which share is being prepared, so its button says so and both wait
	let busy = $state<'' | 'whatsapp' | 'image'>('');
	async function busyWhile(which: 'whatsapp' | 'image', p: Promise<void>) {
		busy = which;
		try {
			await p;
		} finally {
			busy = '';
		}
	}

	// On phones the receipt image goes too, with the summary as its caption (WhatsApp Web drops text pasted with an image)
	function copyWhatsApp() {
		const b = snapshot(), c = currentSplit(), editable = linkIsEdit();
		const text = linkUrl().then((link) => (link ? summary(b, c, link, editable) : ''));
		if (canShare) busyWhile('whatsapp', shareReceipt(text, 'Share to WhatsApp'));
		else copyP(text, 'Summary copied', EDIT_FAIL);
	}

	const shareImage = () => busyWhile('image', shareReceipt());
</script>

<Section title="Share">
	{#snippet action()}
		{#if !app.ro}
			<div class="flex items-center gap-2">
				<Switch id="canedit" bind:checked={app.canEdit} />
				<Label for="canedit" class="text-[13px] font-normal">Allow editing</Label>
			</div>
		{/if}
	{/snippet}
	<div class="flex flex-wrap gap-2 *:flex-[1_1_150px]">
		<Button size="lg" onclick={copyLink}>Copy link</Button>
		<!-- On phones it shares the image, so like the image button it needs someone on the bill -->
		<Button size="lg" variant="outline" disabled={!!busy || (canShare && !app.bill.p.length)} onclick={copyWhatsApp}>{busy === 'whatsapp' ? 'Preparing…' : canShare ? 'Share to WhatsApp' : 'Copy for WhatsApp'}</Button>
		<Button size="lg" variant="outline" disabled={!!busy || !app.bill.p.length} onclick={shareImage}><ImageIcon />{busy === 'image' ? 'Preparing…' : canShare ? 'Share image' : 'Copy image'}</Button>
	</div>
	<p class="mt-2.5 text-sm text-muted-foreground">{app.ro ? 'This shared bill is read-only.' : 'Links expire 30 days after the last edit.'}</p>
	<p class="mt-1 text-sm text-muted-foreground" class:hidden={app.mode !== 'edit'} aria-live="polite">{app.saveStatus}</p>
</Section>
