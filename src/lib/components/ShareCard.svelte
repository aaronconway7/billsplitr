<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import ShareIcon from '@lucide/svelte/icons/share';
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
	let busy = $state(false);
	async function busyWhile(p: Promise<void>) {
		busy = true;
		try {
			await p;
		} finally {
			busy = false;
		}
	}

	// The summary text, followed by the bill's link ('' if no link could be made)
	function summaryText() {
		const b = snapshot(), c = currentSplit(), editable = linkIsEdit();
		return linkUrl().then((link) => (link ? summary(b, c, link, editable) : ''));
	}

	// Phones: one share sheet with the receipt image and the summary as its caption
	const shareAll = () => busyWhile(shareReceipt(summaryText(), 'Share'));
	// Desktops copy them separately, since chat apps drop text pasted along with an image
	const copySummary = () => copyP(summaryText(), 'Summary copied', EDIT_FAIL);
	const copyImage = () => busyWhile(shareReceipt());
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
		{#if canShare}
			<Button size="lg" variant="outline" disabled={busy || !app.bill.p.length} onclick={shareAll}><ShareIcon />{busy ? 'Preparing…' : 'Share'}</Button>
		{:else}
			<Button size="lg" variant="outline" onclick={copySummary}>Copy summary</Button>
			<Button size="lg" variant="outline" disabled={busy || !app.bill.p.length} onclick={copyImage}><ImageIcon />{busy ? 'Preparing…' : 'Copy image'}</Button>
		{/if}
	</div>
	<p class="mt-2.5 text-sm text-muted-foreground">{app.ro ? 'This shared bill is read-only.' : 'Links expire 30 days after the last edit.'}</p>
	<p class="mt-1 text-sm text-muted-foreground" class:hidden={app.mode !== 'edit'} aria-live="polite">{app.saveStatus}</p>
</Section>
