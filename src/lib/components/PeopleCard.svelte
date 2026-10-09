<script lang="ts">
	import { addPerson, app, removePerson } from '#lib/state.svelte.ts';

	let name = $state('');
	let input = $state<HTMLInputElement>();

	function add() {
		if (!addPerson(name)) return;
		name = '';
		input?.focus();
	}
</script>

<div class="card">
	<h2>1 · Who's splitting?</h2>
	{#if !app.ro}
		<div class="row">
			<input bind:this={input} bind:value={name} placeholder="Add a name" maxlength="20" autocomplete="off" onkeydown={(e) => e.key === 'Enter' && add()} />
			<button class="p" onclick={add}>Add</button>
		</div>
	{/if}
	<div class="chips">
		{#each app.bill.p as p, k}
			<span class="chip on">{p}{#if !app.ro}{' '}<button class="x" aria-label="Remove {p}" onclick={() => removePerson(k)}>×</button>{/if}</span>
		{:else}
			<span class="empty">Add at least two people.</span>
		{/each}
	</div>
</div>
