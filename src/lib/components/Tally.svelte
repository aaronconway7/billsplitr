<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { money } from '#lib/currencies.ts';
	import { rollFor } from '#lib/motion.ts';

	// An amount in pence that rolls to its new value like a till
	let { p, c }: { p: number; c: string } = $props();
	const shown = Tween.of(() => p, { duration: rollFor, easing: cubicOut });
</script>

{money(Math.round(shown.current), c)}
