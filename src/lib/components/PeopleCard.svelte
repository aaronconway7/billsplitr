<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { addPerson, app, removePerson, renamePerson } from '#lib/editor.svelte.ts';
	import { pop } from '#lib/motion.ts';
	import Chip from './Chip.svelte';
	import Section from './Section.svelte';

	let name = $state('');
	let input = $state<HTMLInputElement | null>(null);

	function add() {
		if (!addPerson(name)) return;
		name = '';
		input?.focus();
	}
	// A blank name goes back to what's stored
	function rename(e: Event & { currentTarget: HTMLInputElement }, k: number) {
		renamePerson(k, e.currentTarget.value);
		e.currentTarget.value = app.bill.p[k];
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
		<!-- Names can repeat, so chips can't be keyed: they pop in but leave without an outro (it would hit the wrong chip) -->
		{#each app.bill.p as p, k}
			<span class="inline-flex" in:pop>
				<Chip on>
					{#if app.ro}
						{p}
					{:else}
						<input
							value={p}
							maxlength={20}
							autocomplete="off"
							aria-label="Name of {p}"
							class="field-sizing-content min-w-4 bg-transparent outline-none focus:underline"
							onchange={(e) => rename(e, k)}
							onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
						/>
						<Button variant="ghost" size="icon-xs" class="-mr-1.5 rounded-full text-muted-foreground" aria-label="Remove {p}" onclick={() => removePerson(k)}><XIcon /></Button>
					{/if}
				</Chip>
			</span>
		{:else}
			<span class="text-sm text-muted-foreground">Add at least two people.</span>
		{/each}
	</div>
</Section>
