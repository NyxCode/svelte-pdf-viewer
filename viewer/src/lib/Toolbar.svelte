<script lang="ts">
	import Menu from 'svelte-material-icons/Menu.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import Download from 'svelte-material-icons/Download.svelte';
	import Printer from 'svelte-material-icons/Printer.svelte';
	import ToolbarButton from './ToolbarButton.svelte';
	import CurrentPageInput from './CurrentPageInput.svelte';

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
		<CurrentPageInput on:goto />
		<span class="ml-1">/ 24</span>
	</div>

	<div class="flex flex-row gap-x-1">
		<ToolbarButton>
			<Download size="1.5em" />
		</ToolbarButton>
		<ToolbarButton>
			<Printer size="1.5em" />
		</ToolbarButton>
		<ToolbarButton>
			<DotsVertical size="1.5em" />
		</ToolbarButton>
	</div>
</div>
