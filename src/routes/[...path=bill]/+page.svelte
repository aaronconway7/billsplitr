<script lang="ts">
	import { onMount } from 'svelte';
	import Deco from '#lib/components/Deco.svelte';
	import Header from '#lib/components/Header.svelte';
	import ItemsCard from '#lib/components/ItemsCard.svelte';
	import PeopleCard from '#lib/components/PeopleCard.svelte';
	import ResultsCard from '#lib/components/ResultsCard.svelte';
	import ServiceCard from '#lib/components/ServiceCard.svelte';
	import ShareCard from '#lib/components/ShareCard.svelte';
	import { app } from '#lib/editor.svelte.ts';
	import { boot, connect, flushOnHide } from '#lib/share.svelte.ts';
	import { stickySide } from '#lib/stickySide.ts';

	connect();
	onMount(boot);
</script>

<svelte:window onpagehide={flushOnHide} />

<Deco />
<!-- data-ready: the page is prerendered, so it stays hidden (see app.html) until the bill has loaded and the controls work -->
<main data-ready={app.ready} class="mx-auto max-w-[640px] px-4 pt-5 pb-[60px] min-[960px]:max-w-[1040px]">
	<Header />
	<div class="flex flex-col gap-3.5 min-[960px]:grid min-[960px]:grid-cols-[minmax(0,1fr)_360px] min-[960px]:items-start min-[960px]:gap-5">
		<div class="flex flex-col gap-3.5">
			<PeopleCard />
			<ItemsCard />
			<ServiceCard />
		</div>
		<aside class="flex flex-col gap-3.5 min-[960px]:sticky min-[960px]:top-(--st)" {@attach stickySide}>
			<ResultsCard />
			<ShareCard />
		</aside>
	</div>
</main>
<footer class="mx-auto max-w-[640px] px-4 pb-10 text-center text-sm text-muted-foreground min-[960px]:max-w-[1040px]">
	Created by <a href="https://aaronconway.co.uk" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary hover:underline">Aaron</a> 🍔
</footer>
