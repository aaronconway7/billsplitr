<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Card from '#lib/components/ui/card/index.js';

	let { title, action, children }: { title: string; action?: Snippet; children: Snippet } = $props();
</script>

<Card.Root size="sm" class="text-base">
	<Card.Header class="flex items-center justify-between">
		<Card.Title class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</Card.Title>
		{@render action?.()}
	</Card.Header>
	<Card.Content>{@render children()}</Card.Content>
</Card.Root>
