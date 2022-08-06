<script lang="ts">
	import type { Context, PageData } from './types';
	import { createEventDispatcher, getContext } from 'svelte';
	import { CONTEXT } from './utils';

	export let page: PageData;

	let { currentPage } = getContext<Context>(CONTEXT);
	let dispatch = createEventDispatcher();

	$: src = page.thumbnailUrl ?? '/largepreview.png?' + page.index;
	$: isCurrent = $currentPage == page.index;
	$: imgClasses = isCurrent ? '!border-blue-400' : 'border-transparent';

	function onClick() {
		dispatch('goto', { page: page.index });
	}
</script>

<div
	bind:this={page.thumbnailElement}
	class="text-center text-zinc-100 text-lg px-8 py-3"
	on:dragstart|preventDefault
>
	<div class="w-full">
		<img
			alt="Page {page.index + 1}"
			{src}
			class="w-full min-w-full max-w-full cursor-pointer
					 border-[6px] hover:border-zinc-600 {imgClasses}"
			on:click={onClick}
		/>
	</div>
	{page.index + 1}
</div>
