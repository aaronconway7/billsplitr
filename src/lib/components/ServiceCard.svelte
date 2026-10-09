<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { app, setService } from '#lib/editor.svelte.ts';
	import Chip from './Chip.svelte';
	import Section from './Section.svelte';

	const PRESETS = [0, 10, 12.5, 15];
	const sc = $derived(app.bill.sc);
</script>

<Section title="3 · Service & tip">
	<div class="flex flex-wrap items-center gap-1.5">
		{#if app.ro}
			<Chip on>{sc ? sc + '%' : 'None'}</Chip>
		{:else}
			{#each PRESETS as v}
				<Chip on={sc === v} onclick={() => setService(v)}>{v ? v + '%' : 'None'}</Chip>
			{/each}
			<Input type="number" inputmode="decimal" min="0" max="100" step="0.5" placeholder="Custom %" class="h-8 w-36 max-w-full" value={PRESETS.includes(sc) ? '' : sc} onchange={(e) => setService(parseFloat(e.currentTarget.value))} />
		{/if}
	</div>
	<p class="mt-2 text-sm text-muted-foreground">Shared in proportion to what each person ordered. Check whether service is already on the bill.</p>
</Section>
