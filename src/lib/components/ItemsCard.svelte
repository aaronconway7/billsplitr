<script lang="ts">
	import { curDec, curMeta, curStep, money } from '#lib/currencies.ts';
	import { addItem, app, assignAll, removeItem, toggleShare } from '#lib/state.svelte.ts';

	let name = $state('');
	let amount = $state<number | null>(null);
	let input = $state<HTMLInputElement>();
	const cur = $derived(curMeta(app.bill.c));

	function add() {
		if (!addItem(name, amount == null ? '' : String(amount))) return;
		name = '';
		amount = null;
		input?.focus();
	}
	const onkeydown = (e: KeyboardEvent) => e.key === 'Enter' && add();
</script>

<div class="card">
	<h2>2 · Items</h2>
	{#if !app.ro}
		<div class="row">
			<input bind:this={input} bind:value={name} placeholder="Item (e.g. Margherita)" maxlength="40" autocomplete="off" {onkeydown} />
			<input bind:value={amount} type="number" inputmode="decimal" step={curStep(curDec(cur))} min="0" placeholder={cur.sym} style="max-width:96px" {onkeydown} />
			<button class="p" onclick={add}>Add</button>
		</div>
	{/if}
	<div style="margin-top:6px">
		{#each app.bill.i as it, j}
			<div class="item">
				<div class="ih">
					<b>{it.n}</b>
					<span><span class="amt" style="font-size:16px">{money(Math.round(it.a * 100), app.bill.c)}</span>{#if !app.ro}<button class="x" aria-label="Remove item" onclick={() => removeItem(j)}>×</button>{/if}</span>
				</div>
				<div class="chips" style="margin-top:8px">
					{#if app.ro}
						{#each app.bill.p as p, k}
							{#if it.s.includes(k)}<span class="chip on">{p}</span>{/if}
						{/each}
						{#if !app.bill.p.some((_, k) => it.s.includes(k))}<span class="empty">Unassigned</span>{/if}
					{:else}
						{#each app.bill.p as p, k}
							<button class="chip" class:on={it.s.includes(k)} onclick={() => toggleShare(j, k)}>{p}</button>
						{/each}
						{#if app.bill.p.length > 1}<button class="chip" onclick={() => assignAll(j)}>Everyone</button>{/if}
					{/if}
				</div>
			</div>
		{:else}
			<p class="empty">No items yet.</p>
		{/each}
	</div>
</div>
