<script lang="ts">
	import { money as fmt } from '#lib/currencies.ts';
	import { app, currentSplit, togglePayer } from '#lib/editor.svelte.ts';
	import { rowIn, rowOut } from '#lib/motion.ts';
	import { serviceLabel } from '#lib/summary.ts';
	import Chip from './Chip.svelte';
	import Tally from './Tally.svelte';

	const b = $derived(app.bill);
	const c = $derived(currentSplit());
	const money = (p: number) => fmt(p, b.c);
	const payer = $derived(b.pd > -1 ? b.p[b.pd] : undefined);
	// "X pays Y £n" for everyone who owes the payer something
	const lines = $derived(payer === undefined ? [] : b.p.flatMap((p, k) => (k !== b.pd && c.tot[k] ? [`${p} pays ${payer} ${money(c.tot[k])}`] : [])));
	// Read-only bills show just the payer
	const payerChoices = $derived(app.ro ? (payer === undefined ? [] : [b.pd]) : b.p.map((_, k) => k));
	const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
</script>

<!-- Printed like a till receipt; the shadow sits on a wrapper because the torn-edge mask would clip it -->
<div class="drop-shadow-[0_1px_2px_rgb(0_0_0/0.12)]">
	<section id="receipt" class="receipt bg-paper px-5 py-7 text-base" aria-labelledby="results-title">
		<header class="text-center">
			<p class="text-xs font-bold tracking-[0.2em] text-primary uppercase">BillSplitr</p>
			<h2 id="results-title" class="mt-1 text-lg font-semibold">Who owes what</h2>
			<p class="mt-0.5 text-xs text-muted-foreground">{count(b.p.length, 'person', 'people')} · {count(b.i.length, 'item', 'items')}</p>
		</header>
		<div class="receipt-rule"></div>
		{#if b.p.length}
			<ul class="space-y-2.5" aria-label="Who owes what">
				{#each b.p as p, k}
					<li in:rowIn>
						<div class="flex items-baseline">
							<span class="min-w-0 font-semibold break-words">{p}</span>
							<span class="leader" aria-hidden="true"></span>
							<span class="font-mono text-lg font-bold tabular-nums"><Tally p={c.tot[k]} c={b.c} /></span>
						</div>
						<div class="text-sm text-muted-foreground">{money(c.own[k])}{c.svcBy[k] ? ' + ' + money(c.svcBy[k]) + ' service' : ''}{b.pd === k ? ' · paid' : ''}</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-center text-sm text-muted-foreground">Add people and items to see the split.</p>
		{/if}
		<div class="receipt-rule"></div>
		<div class="space-y-1.5">
			<div class="flex justify-between"><span>Items</span><span class="font-mono tabular-nums"><Tally p={c.sub} c={b.c} /></span></div>
			{#if c.svc}<div class="flex justify-between" in:rowIn out:rowOut><span>Service / tip{b.sm ? '' : ' (' + serviceLabel(b) + ')'}</span><span class="font-mono tabular-nums"><Tally p={c.svc} c={b.c} /></span></div>{/if}
			<div class="flex justify-between pt-1 text-lg font-bold uppercase"><span>Total</span><span class="font-mono tabular-nums"><Tally p={c.total} c={b.c} /></span></div>
		</div>
		{#if c.un || lines.length}
			<div in:rowIn out:rowOut>
				<div class="receipt-rule"></div>
				{#if c.un}<p class="text-sm text-destructive" in:rowIn out:rowOut>{money(c.un)} of items{c.unSvc ? ' (+ ' + money(c.unSvc) + ' service)' : ''} aren't assigned to anyone yet.</p>{/if}
				{#if lines.length}
					<div class="text-sm text-muted-foreground" class:mt-2={c.un} in:rowIn out:rowOut>
						{#each lines as l}<div in:rowIn>{l}</div>{/each}
					</div>
				{/if}
			</div>
		{/if}
		<!-- Left out of the shared image -->
		<div class="receipt-rule" data-capture="skip"></div>
		<div class="text-sm text-muted-foreground" data-capture="skip">
			Who paid the bill?
			<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
				{#each payerChoices as k}
					<Chip on={b.pd === k} onclick={() => togglePayer(k)}>{b.p[k]}</Chip>
				{:else}—{/each}
			</div>
		</div>
		<p class="mt-5 text-center font-mono text-xs tracking-widest text-muted-foreground">** THANK YOU **</p>
	</section>
</div>
