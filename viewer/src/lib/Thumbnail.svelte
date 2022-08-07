<script lang="ts">
	import type { Context, PageData } from './types';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import { CONTEXT } from './utils';

	export let page: PageData;

	let { currentPage } = getContext<Context>(CONTEXT);
	let dispatch = createEventDispatcher();

	let wrapper: HTMLDivElement;

	$: isCurrent = $currentPage == page.index;
	$: imgClasses = isCurrent ? '!border-blue-400' : 'border-transparent';

	function onClick() {
		dispatch('goto', { page: page.index });
	}

	const width = 180;
	$: height = width / page.pdfThumbnail.aspectRatio;

	onMount(async () => {
		await page.pdfThumbnail.initialize(wrapper);
		await page.pdfThumbnail.render(width);
	});
</script>

<div
	bind:this={page.thumbnailElement}
	class="text-center text-zinc-100 text-lg px-8 py-3"
	on:dragstart|preventDefault
>
	<div
		class="box-border cursor-pointer border-[6px] width-[196px] hover:border-zinc-600 {imgClasses}"
		on:click={onClick}
		bind:this={wrapper}
	/>
	{page.index + 1}
</div>
