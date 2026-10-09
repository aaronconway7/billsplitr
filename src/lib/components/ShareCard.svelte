<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { copyP } from '#lib/clipboard.ts';
	import { money as fmt } from '#lib/currencies.ts';
	import { calc } from '#lib/split.ts';
	import { app, EDIT_FAIL, linkIsEdit, linkUrl } from '#lib/state.svelte.ts';
	import Section from './Section.svelte';

	function copyLink() {
		copyP(linkUrl(), linkIsEdit() ? 'Edit link copied' : 'Link copied', EDIT_FAIL);
	}

	function copyWhatsApp() {
		const b = app.bill, c = calc(b), pd = b.p[b.pd];
		const money = (p: number) => fmt(p, b.c);
		let t = '🧾 *Bill split*\nTotal: *' + money(c.sub + c.svc) + '*' + (b.sc ? ' (incl. ' + b.sc + '% service)' : '') + '\n\n';
		t += pd ? '💸 *Pay ' + pd + ':*\n' : '*Who owes what:*\n';
		b.p.forEach((p, k) => {
			if (k !== b.pd) t += '• ' + p + ' – ' + money(c.tot[k]) + '\n';
		});
		if (c.un) t += '\n⚠️ ' + money(c.un) + ' not yet assigned\n';
		const ed = linkIsEdit();
		copyP(linkUrl().then((L) => (L ? (t + '\n' + (ed ? 'View or edit the split: ' : 'See the full split: ') + L).trim() : '')), 'Summary copied', EDIT_FAIL);
	}
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
		<Button size="lg" variant="outline" onclick={copyWhatsApp}>Copy for WhatsApp</Button>
	</div>
	<p class="mt-2.5 text-sm text-muted-foreground">{app.ro ? 'This shared bill is read-only.' : 'Links expire 30 days after the last edit.'}</p>
	<p class="mt-1 text-sm text-muted-foreground" class:hidden={app.mode !== 'edit'} aria-live="polite">{app.saveStatus}</p>
</Section>
