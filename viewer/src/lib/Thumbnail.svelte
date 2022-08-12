<script lang="ts">
	import type { Context, PageData } from './types';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import { CONTEXT } from './utils';

	const width = 180;

	export let page: PageData;

	let { currentPage } = getContext<Context>(CONTEXT);
	let dispatch = createEventDispatcher();

	let wrapper: HTMLDivElement;

	$: imgClasses = $currentPage == page.index ? '!border-blue-400' : 'border-transparent';
	$: height = Math.floor(width / page.pdfPage.aspectRatio);
	$: style = `
			width: ${width}px;
			height: ${height}px;
			min-width: ${width}px;
			min-height: ${height}px;
			max-width: ${width}px;
			max-height: ${height}px;
		`;

	function onClick() {
		dispatch('goto', { page: page.index });
	}

	onMount(async () => {
		await page.pdfThumbnail.initialize(wrapper);
		await page.pdfThumbnail.resized(width);
		await page.pdfThumbnail.render(width);
	});
</script>

<div
	bind:this={page.thumbnailElement}
	class="text-center text-zinc-100 text-lg px-8 py-3"
	on:dragstart|preventDefault
>
	<div
		{style}
		class="box-content cursor-pointer border-[6px] w-[192px] hover:border-zinc-600 {imgClasses}"
		on:click={onClick}
		bind:this={wrapper}
	/>
	{page.index + 1}
</div>
