<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';

	// A pill: a toggle button when it has an onclick, otherwise a plain label (people, and read-only bills)
	let { on = false, onclick, children }: { on?: boolean; onclick?: () => void; children: Snippet } = $props();

	const pill = 'h-8 rounded-full px-3 text-sm font-normal';
	const selected = 'border-primary bg-accent font-semibold text-accent-foreground hover:bg-accent dark:border-primary dark:bg-accent dark:hover:bg-accent';
</script>

{#if onclick}
	<Button variant="outline" size="sm" aria-pressed={on} {onclick} class={cn(pill, 'bg-secondary shadow-none dark:bg-secondary', on && selected)}>
		{@render children()}
	</Button>
{:else}
	<Badge variant="outline" class={cn(pill, on && selected)}>{@render children()}</Badge>
{/if}
