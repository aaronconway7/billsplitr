<script lang="ts">
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { money as fmt } from '#lib/currencies.ts';
	import { calc } from '#lib/split.ts';
	import { app, togglePayer } from '#lib/state.svelte.ts';
	import Chip from './Chip.svelte';
	import Section from './Section.svelte';

	const b = $derived(app.bill);
	const c = $derived(calc(b));
	const money = (p: number) => fmt(p, b.c);
	const payer = $derived(b.pd > -1 ? b.p[b.pd] : undefined);
	// "X pays Y £n" for everyone who owes the payer something
	const lines = $derived(payer === undefined ? [] : b.p.flatMap((p, k) => (k !== b.pd && c.tot[k] ? [`${p} pays ${payer} ${money(c.tot[k])}`] : [])));
</script>

<Section title="Who owes what">
	<div class="divide-y">
		{#each b.p as p, k}
			<div class="flex items-center justify-between py-2.5">
				<div>
					<div class="font-semibold">{p}</div>
					<div class="text-sm text-muted-foreground">{money(c.own[k])}{b.pd === k ? ' · paid' : ''}</div>
				</div>
				<div class="text-lg font-bold tabular-nums">{money(c.tot[k])}</div>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">Add people and items to see the split.</p>
		{/each}
	</div>
	<div class="mt-2 space-y-2 tabular-nums">
		<div class="flex justify-between"><span>Items</span><span>{money(c.sub)}</span></div>
		{#if c.svc}<div class="flex justify-between"><span>Service / tip ({b.sc}%)</span><span>{money(c.svc)}</span></div>{/if}
		<Separator />
		<div class="flex justify-between text-lg font-bold"><span>Total</span><span>{money(c.sub + c.svc)}</span></div>
	</div>
	{#if c.un}<p class="mt-2 text-sm text-destructive">{money(c.un)} of items aren't assigned to anyone yet.</p>{/if}
	{#if lines.length}
		<div class="mt-2.5 text-sm text-muted-foreground">
			{#each lines as l}<div>{l}</div>{/each}
		</div>
	{/if}
	<div class="mt-3 text-sm text-muted-foreground">
		Who paid the bill?
		<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
			{#if app.ro}
				{#if payer !== undefined}<Chip on>{payer}</Chip>{:else}—{/if}
			{:else}
				{#each b.p as p, k}
					<Chip on={b.pd === k} onclick={() => togglePayer(k)}>{p}</Chip>
				{:else}—{/each}
			{/if}
		</div>
	</div>
</Section>
