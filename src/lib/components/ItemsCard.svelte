<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { curDec, curMeta, curStep, money } from '#lib/currencies.ts';
	import { addItem, app, assignAll, removeItem, toggleShare } from '#lib/state.svelte.ts';
	import Chip from './Chip.svelte';
	import Section from './Section.svelte';

	let name = $state('');
	let amount = $state<number | null>(null);
	let input = $state<HTMLInputElement | null>(null);
	const cur = $derived(curMeta(app.bill.c));

	function add() {
		if (!addItem(name, amount == null ? '' : String(amount))) return;
		name = '';
		amount = null;
		input?.focus();
	}
	const onkeydown = (e: KeyboardEvent) => e.key === 'Enter' && add();
</script>

<Section title="2 · Items">
	{#if !app.ro}
		<div class="flex gap-2">
			<Input bind:ref={input} bind:value={name} placeholder="Item (e.g. Margherita)" maxlength={40} autocomplete="off" class="h-10" {onkeydown} />
			<Input bind:value={amount} type="number" inputmode="decimal" step={curStep(curDec(cur))} min="0" placeholder={cur.sym} class="h-10 max-w-24" {onkeydown} />
			<Button size="lg" onclick={add}>Add</Button>
		</div>
	{/if}
	{#if app.bill.i.length}
		<ul class="mt-1.5 divide-y" aria-label="Items">
			{#each app.bill.i as it, j}
				<li class="py-3">
					<div class="flex items-center justify-between gap-2">
						<span class="font-semibold">{it.n}</span>
						<span class="flex items-center gap-1">
							<span class="font-bold tabular-nums">{money(Math.round(it.a * 100), app.bill.c)}</span>
							{#if !app.ro}
								<Button variant="ghost" size="icon-xs" class="text-muted-foreground" aria-label="Remove item" onclick={() => removeItem(j)}><XIcon /></Button>
							{/if}
						</span>
					</div>
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#if app.ro}
							{#each app.bill.p as p, k}
								{#if it.s.includes(k)}<Chip on>{p}</Chip>{/if}
							{/each}
							{#if !app.bill.p.some((_, k) => it.s.includes(k))}<span class="text-sm text-muted-foreground">Unassigned</span>{/if}
						{:else}
							{#each app.bill.p as p, k}
								<Chip on={it.s.includes(k)} onclick={() => toggleShare(j, k)}>{p}</Chip>
							{/each}
							{#if app.bill.p.length > 1}<Chip onclick={() => assignAll(j)}>Everyone</Chip>{/if}
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-3 text-sm text-muted-foreground">No items yet.</p>
	{/if}
</Section>
