<script lang="ts">
	import { app, setService } from '#lib/state.svelte.ts';

	const PRESETS = [0, 10, 12.5, 15];
	const sc = $derived(app.bill.sc);
</script>

<div class="card">
	<h2>3 · Service &amp; tip</h2>
	<div class="seg">
		{#if app.ro}
			<span class="chip on">{sc ? sc + '%' : 'None'}</span>
		{:else}
			{#each PRESETS as v}
				<button class="chip" class:on={sc === v} onclick={() => setService(v)}>{v ? v + '%' : 'None'}</button>
			{/each}
			<input type="number" inputmode="decimal" min="0" max="100" step="0.5" placeholder="Custom %" style="width:140px;max-width:100%" value={PRESETS.includes(sc) ? '' : sc} onchange={(e) => setService(parseFloat(e.currentTarget.value))} />
		{/if}
	</div>
	<p class="mute" style="margin:8px 0 0">Shared in proportion to what each person ordered. Check whether service is already on the bill.</p>
</div>
