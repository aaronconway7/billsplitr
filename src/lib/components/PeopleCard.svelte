<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { addPerson, app, removePerson } from '#lib/state.svelte.ts';
	import Chip from './Chip.svelte';
	import Section from './Section.svelte';

	let name = $state('');
	let input = $state<HTMLInputElement | null>(null);

	function add() {
		if (!addPerson(name)) return;
		name = '';
		input?.focus();
	}
</script>

<Section title="1 · Who's splitting?">
	{#if !app.ro}
		<div class="flex gap-2">
			<Input bind:ref={input} bind:value={name} placeholder="Add a name" maxlength={20} autocomplete="off" class="h-10" onkeydown={(e) => e.key === 'Enter' && add()} />
			<Button size="lg" onclick={add}>Add</Button>
		</div>
	{/if}
	<div class="mt-2.5 flex flex-wrap gap-1.5">
		{#each app.bill.p as p, k}
			<Chip on>
				{p}
				{#if !app.ro}
					<Button variant="ghost" size="icon-xs" class="-mr-1.5 rounded-full text-muted-foreground" aria-label="Remove {p}" onclick={() => removePerson(k)}><XIcon /></Button>
				{/if}
			</Chip>
		{:else}
			<span class="text-sm text-muted-foreground">Add at least two people.</span>
		{/each}
	</div>
</Section>
