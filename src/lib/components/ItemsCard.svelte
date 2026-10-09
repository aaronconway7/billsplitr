<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { curDec, curMeta, curStep, money } from '#lib/currencies.ts';
	import { addItem, app, assignAll, removeItem, toggleShare, updateItem } from '#lib/editor.svelte.ts';
	import { fadeIn, reflow, rowIn, rowOut } from '#lib/motion.ts';
	import Chip from './Chip.svelte';
	import Section from './Section.svelte';

	let name = $state('');
	let amount = $state<number | null>(null);
	let input = $state<HTMLInputElement | null>(null);
	const cur = $derived(curMeta(app.bill.c));

	function add() {
		if (!addItem(name, amount)) return;
		name = '';
		amount = null;
		input?.focus();
	}
	const onkeydown = (e: KeyboardEvent) => e.key === 'Enter' && add();
	// Inline fields look like text until hovered or focused
	const inline = 'h-8 border-transparent bg-transparent px-1.5 shadow-none hover:border-input dark:bg-transparent';
	const price = (a: number) => a.toFixed(curDec(cur));
	// A cleared field goes back to what's stored
	function commit(e: Event & { currentTarget: HTMLInputElement }, j: number, key: 'n' | 'a') {
		const v = e.currentTarget.value;
		updateItem(j, key === 'n' ? { n: v } : { a: v === '' ? null : parseFloat(v) });
		const it = app.bill.i[j];
		e.currentTarget.value = key === 'n' ? it.n : price(it.a);
	}
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
			<!-- Keyed by the item itself, so removing one animates that row -->
			{#each app.bill.i as it, j (it)}
				<li class="py-3" in:rowIn|global out:rowOut|global animate:reflow>
					<div class="flex items-center justify-between gap-2">
						{#if app.ro}
							<span class="font-semibold">{it.n}</span>
							<span class="font-bold tabular-nums">{money(Math.round(it.a * 100), app.bill.c)}</span>
						{:else}
							<Input value={it.n} maxlength={40} autocomplete="off" aria-label="Item name" class="{inline} -ml-1.5 font-semibold" onchange={(e) => commit(e, j, 'n')} />
							<span class="flex items-center gap-1">
								<span class="text-sm text-muted-foreground">{cur.sym}</span>
								<Input value={price(it.a)} type="number" inputmode="decimal" step={curStep(curDec(cur))} min="0" aria-label="Price of {it.n}" class="{inline} w-24 text-right font-bold tabular-nums" onchange={(e) => commit(e, j, 'a')} />
								<Button variant="ghost" size="icon-xs" class="text-muted-foreground" aria-label="Remove item" onclick={() => removeItem(j)}><XIcon /></Button>
							</span>
						{/if}
					</div>
					<div class="mt-2 flex flex-wrap gap-1.5">
						<!-- Read-only bills show just who's sharing -->
						{#each app.bill.p as p, k}
							{#if !app.ro || it.s.includes(k)}<Chip on={it.s.includes(k)} onclick={() => toggleShare(j, k)}>{p}</Chip>{/if}
						{/each}
						{#if app.ro && !app.bill.p.some((_, k) => it.s.includes(k))}<span class="text-sm text-muted-foreground">Unassigned</span>{/if}
						{#if !app.ro && app.bill.p.length > 1}<Chip onclick={() => assignAll(j)}>Everyone</Chip>{/if}
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-3 text-sm text-muted-foreground" in:fadeIn>No items yet.</p>
	{/if}
</Section>
