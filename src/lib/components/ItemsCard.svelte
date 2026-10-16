<script lang="ts">
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { MAX_W } from '#lib/bill.ts';
	import { curDec, curMeta, curStep, money } from '#lib/currencies.ts';
	import { addItem, app, assignAll, removeItem, setUneven, stepShare, toggleShare, updateItem } from '#lib/editor.svelte.ts';
	import { itemShares, portion } from '#lib/split.ts';
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
			{#each app.bill.i as it, j}
				{@const shares = itemShares(it, app.bill.p.length)}
				<li class="py-3">
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
						<!-- The same quiet button turns an uneven split on and off -->
						{#if !app.ro && shares.length > 1}
							<button type="button" class="h-8 px-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onclick={() => setUneven(j, !it.w)}>
								{it.w ? 'Split evenly' : 'Split unevenly'}
							</button>
						{/if}
					</div>
					<!-- Uneven items show each sharer's portion and what it costs; the weights behind them stay hidden -->
					{#if it.w && shares.length > 1}
						{@const sum = shares.reduce((a, v) => a + v.w, 0)}
						<ul class="mt-3 divide-y divide-border/60 rounded-xl bg-muted/60 px-3" aria-label="Shares of {it.n}">
							{#each shares as v (v.at)}
								{@const who = app.bill.p[v.x]}
								<li class="flex items-center gap-3 py-2 text-sm">
									<span class="min-w-0 flex-1 truncate">{who}</span>
									{#if app.ro}
										<span class="text-muted-foreground">{portion(v.w, sum)}</span>
									{:else}
										<span class="inline-flex items-center rounded-full border bg-background">
											<Button variant="ghost" size="icon-xs" class="size-7 rounded-full" aria-label="Less for {who}" disabled={v.w <= 1} onclick={() => stepShare(j, v.at, -1)}><MinusIcon /></Button>
											<span class="w-9 text-center font-medium">{portion(v.w, sum)}</span>
											<Button variant="ghost" size="icon-xs" class="size-7 rounded-full" aria-label="More for {who}" disabled={v.w >= MAX_W} onclick={() => stepShare(j, v.at, 1)}><PlusIcon /></Button>
										</span>
									{/if}
									<span class="w-16 text-right font-semibold tabular-nums">{money(v.pence, app.bill.c)}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-3 text-sm text-muted-foreground">No items yet.</p>
	{/if}
</Section>
