<script lang="ts">
	import { money as fmt } from '#lib/currencies.ts';
	import { calc } from '#lib/split.ts';
	import { app, togglePayer } from '#lib/state.svelte.ts';

	const b = $derived(app.bill);
	const c = $derived(calc(b));
	const money = (p: number) => fmt(p, b.c);
	const payer = $derived(b.pd > -1 ? b.p[b.pd] : undefined);
	// "X pays Y £n" for everyone who owes the payer something
	const lines = $derived(payer === undefined ? [] : b.p.flatMap((p, k) => (k !== b.pd && c.tot[k] ? [`${p} pays ${payer} ${money(c.tot[k])}`] : [])));
</script>

<div class="card">
	<h2>Who owes what</h2>
	<div>
		{#each b.p as p, k}
			<div class="person">
				<div><b>{p}</b><div class="mute">{money(c.own[k])}{b.pd === k ? ' · paid' : ''}</div></div>
				<div class="amt">{money(c.tot[k])}</div>
			</div>
		{:else}
			<p class="empty">Add people and items to see the split.</p>
		{/each}
		<div class="tot" style="margin-top:8px"><span>Items</span><span>{money(c.sub)}</span></div>
		{#if c.svc}<div class="tot"><span>Service / tip ({b.sc}%)</span><span>{money(c.svc)}</span></div>{/if}
		<div class="tot g"><span>Total</span><span>{money(c.sub + c.svc)}</span></div>
		{#if c.un}<div class="warn">{money(c.un)} of items aren't assigned to anyone yet.</div>{/if}
		{#if lines.length}<div class="mute" style="margin-top:10px">{#each lines as l, i}{#if i}<br />{/if}{l}{/each}</div>{/if}
	</div>
	<div style="margin-top:12px" class="mute">
		Who paid the bill? <span class="seg" style="margin-top:6px">
			{#if app.ro}
				{#if payer !== undefined}<span class="chip on">{payer}</span>{:else}—{/if}
			{:else}
				{#each b.p as p, k}
					<button class="chip" class:on={b.pd === k} onclick={() => togglePayer(k)}>{p}</button>
				{:else}—{/each}
			{/if}
		</span>
	</div>
</div>
