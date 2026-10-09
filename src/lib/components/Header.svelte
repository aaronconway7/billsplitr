<script lang="ts">
	import { C, curLabel } from '#lib/currencies.ts';
	import { app, reset, setCurrency } from '#lib/state.svelte.ts';

	function newBill() {
		const msg = app.mode === 'local' ? 'Clear everything and start a new bill?' : 'Start a new bill? Shared links will keep showing this one.';
		if (confirm(msg)) reset();
	}
</script>

<div class="head">
	<h1>Bill<span>Splitr</span></h1>
	<div class="hact">
		<button id="reset" onclick={newBill}>New bill</button>
		<select id="cur" aria-label="Currency" value={app.bill.c} disabled={app.ro} onchange={(e) => setCurrency(e.currentTarget.value)}>
			{#each C as c (c.code)}<option value={c.code}>{curLabel(c)}</option>{/each}
		</select>
	</div>
</div>
<p class="sub">Add the bill, tap who had what, see who owes what. No sign-up.</p>
