<script lang="ts">
	import { copyP } from '#lib/clipboard.ts';
	import { money as fmt } from '#lib/currencies.ts';
	import { calc } from '#lib/split.ts';
	import { app, EDIT_FAIL, linkIsEdit, linkUrl } from '#lib/state.svelte.ts';

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

<div class="card">
	<div class="shd">
		<h2>Share</h2>
		{#if !app.ro}<label class="tog"><input type="checkbox" autocomplete="off" bind:checked={app.canEdit} /> Allow editing</label>{/if}
	</div>
	<div class="share">
		<button class="p" onclick={copyLink}>Copy link</button>
		<button onclick={copyWhatsApp}>Copy for WhatsApp</button>
	</div>
	<p class="mute" style="margin:10px 0 0">{app.ro ? 'This shared bill is read-only.' : 'Links expire 30 days after the last edit.'}</p>
	<p class="mute" style="margin:4px 0 0" style:display={app.mode === 'edit' ? null : 'none'} aria-live="polite">{app.saveStatus}</p>
</div>
