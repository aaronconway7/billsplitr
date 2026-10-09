<script lang="ts">
	import { onMount } from 'svelte';
	import Deco from '#lib/components/Deco.svelte';
	import Header from '#lib/components/Header.svelte';
	import ItemsCard from '#lib/components/ItemsCard.svelte';
	import PeopleCard from '#lib/components/PeopleCard.svelte';
	import ResultsCard from '#lib/components/ResultsCard.svelte';
	import ServiceCard from '#lib/components/ServiceCard.svelte';
	import ShareCard from '#lib/components/ShareCard.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { boot, connect, flushOnHide } from '#lib/state.svelte.ts';
	import { stickySide } from '#lib/stickySide.ts';

	connect();
	onMount(boot);
</script>

<svelte:window onpagehide={flushOnHide} />

<Deco />
<main>
	<Header />
	<div class="layout">
		<div class="steps">
			<PeopleCard />
			<ItemsCard />
			<ServiceCard />
		</div>
		<aside class="side" {@attach stickySide}>
			<ResultsCard />
			<ShareCard />
		</aside>
	</div>
</main>
<footer>Created by <a href="https://aaronconway.co.uk" target="_blank" rel="noopener noreferrer">Aaron</a> 🍔</footer>
<Toast />
