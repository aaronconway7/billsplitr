<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Slider } from '#lib/components/ui/slider/index.js';
	import { curDec, curMeta, curStep } from '#lib/currencies.ts';
	import { app, setService } from '#lib/editor.svelte.ts';
	import { serviceLabel } from '#lib/summary.ts';
	import Chip from './Chip.svelte';
	import Section from './Section.svelte';

	const PRESETS = [0, 10, 12.5, 15];
	const sc = $derived(app.bill.sc);
	const cur = $derived(curMeta(app.bill.c));
	// A fixed service of 0 isn't stored, so the bill that's in Amount mode is remembered here (a newly loaded bill starts from its own sm)
	let pickedFor = $state.raw<object | null>(null);
	const fixed = $derived(!!app.bill.sm || (pickedFor === app.bill && !sc));

	// Switching mode starts the new one from nothing
	function mode(f: boolean) {
		if (f === fixed) return;
		pickedFor = f ? app.bill : null;
		setService(0, f);
	}
</script>

<Section title="3 · Service & tip">
	{#snippet action()}
		{#if !app.ro}
			<div class="flex shrink-0 rounded-full bg-secondary p-0.5" role="group" aria-label="Service type">
				{#each [false, true] as f}
					<button
						type="button"
						aria-pressed={fixed === f}
						class="h-6 rounded-full px-2.5 text-[13px] whitespace-nowrap text-muted-foreground transition-colors aria-pressed:bg-background aria-pressed:font-semibold aria-pressed:text-foreground aria-pressed:shadow-sm"
						onclick={() => mode(f)}>{f ? 'Amount' : 'Percentage'}</button
					>
				{/each}
			</div>
		{/if}
	{/snippet}
	{#if app.ro}
		<Chip on>{sc ? serviceLabel(app.bill) : 'None'}</Chip>
	{:else}
		{#if fixed}
			<div class="flex items-center gap-2">
				<Input
					type="number"
					inputmode="decimal"
					min="0"
					step={curStep(curDec(cur))}
					placeholder="Amount {cur.sym}"
					aria-label="Service amount"
					class="h-10 w-40"
					value={sc || ''}
					onchange={(e) => {
						pickedFor = app.bill;
						setService(parseFloat(e.currentTarget.value), true);
					}}
				/>
			</div>
			<p class="mt-2 text-sm text-muted-foreground">Enter the service charge printed on the bill. It's shared in proportion to what each person ordered.</p>
		{:else}
			<div class="flex flex-wrap gap-1.5">
				{#each PRESETS as v}
					<Chip on={sc === v} onclick={() => setService(v)}>{v ? v + '%' : 'None'}</Chip>
				{/each}
			</div>
			<div class="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
				Adjust
				<Slider type="single" min={0} max={25} step={0.5} value={sc} onValueChange={(v) => setService(v)} class="flex-1" />
				<span class="w-12 text-right font-semibold text-foreground tabular-nums">{sc}%</span>
			</div>
			<p class="mt-2 text-sm text-muted-foreground">Added to the items and shared in proportion to what each person ordered. If the bill already includes service, switch to Amount.</p>
		{/if}
	{/if}
</Section>
