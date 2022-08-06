<script lang="ts">
	import Menu from 'svelte-material-icons/Menu.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import Download from 'svelte-material-icons/Download.svelte';
	import Printer from 'svelte-material-icons/Printer.svelte';
	import ToolbarButton from './ToolbarButton.svelte';
	import CurrentPageInput from './CurrentPageInput.svelte';
	import { getContext } from 'svelte';
	import { CONTEXT } from './utils';
	import type { Context } from './types';

	const { pages, document } = getContext<Context>(CONTEXT);

	export let drawer: boolean;
</script>

<div
	class="bg-zinc-800 text-zinc-100 flex flex-row items-center px-3 py-2 justify-between drop-shadow-lg z-20"
>
	<div class="flex flex-row items-center gap-x-2">
		<ToolbarButton on:click={() => (drawer = !drawer)}>
			<Menu size="1.5em" />
		</ToolbarButton>
		<span class="text-md">FileName.pdf</span>
	</div>

	<div class="flex flex-row items-center text-sm">
		{#if $pages.length > 0}
			<CurrentPageInput on:goto />
			<span class="ml-1">/ {$pages.length}</span>
		{/if}
	</div>

	<div class="flex flex-row gap-x-1">
		<ToolbarButton on:click={() => $document.download()}>
			<Download size="1.5em" />
		</ToolbarButton>
		<ToolbarButton on:click={() => $document.print()}>
			<Printer size="1.5em" />
		</ToolbarButton>
		<ToolbarButton on:click={() => alert('not implemented')}>
			<DotsVertical size="1.5em" />
		</ToolbarButton>
	</div>
</div>
