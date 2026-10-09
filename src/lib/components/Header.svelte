<script lang="ts">
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { C, curLabel, curMeta } from '#lib/currencies.ts';
	import { app, setCurrency } from '#lib/editor.svelte.ts';
	import { newBill } from '#lib/share.svelte.ts';

	let confirming = $state(false);
</script>

<div class="flex flex-wrap items-start justify-between gap-3">
	<h1 class="text-[28px] leading-tight font-bold tracking-tight">Bill<span class="text-primary">Splitr</span></h1>
	<div class="flex items-center gap-2">
		<Button variant="outline" size="sm" onclick={() => (confirming = true)}>New bill</Button>
		<Select.Root type="single" bind:value={() => app.bill.c, setCurrency} disabled={app.ro}>
			<Select.Trigger size="sm" aria-label="Currency" class="min-w-[190px] bg-card max-[480px]:max-w-[124px] max-[480px]:min-w-0">
				<span class="truncate">{curLabel(curMeta(app.bill.c))}</span>
			</Select.Trigger>
			<Select.Content class="max-h-80">
				{#each C as c (c.code)}<Select.Item value={c.code} label={curLabel(c)} />{/each}
			</Select.Content>
		</Select.Root>
	</div>
</div>
<p class="mt-1.5 mb-[18px] text-muted-foreground">Add the bill, tap who had what, see who owes what. No sign-up.</p>

<AlertDialog.Root bind:open={confirming}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Start a new bill?</AlertDialog.Title>
			<AlertDialog.Description>
				{app.mode === 'local' ? 'This clears everything on this bill.' : 'Shared links will keep showing this one.'}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={() => ((confirming = false), newBill())}>New bill</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
