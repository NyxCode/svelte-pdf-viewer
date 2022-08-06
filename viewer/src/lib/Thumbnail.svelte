<script lang="ts">
	import type { Context, PageData } from './types';
	import { createEventDispatcher, getContext, onMount, tick } from 'svelte';
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

	let width = 0;
	$: height = width / page.pdfThumbnail.aspectRatio;

	onMount(async () => {
		width = wrapper.clientWidth;
		await page.pdfThumbnail.initialize(wrapper);
		await page.pdfThumbnail.resized(width);
		await tick();
		setTimeout(() => {
			page.pdfThumbnail.render(width);
		}, 0);
	});
</script>

<div
	bind:this={page.thumbnailElement}
	class="text-center text-zinc-100 text-lg px-8 py-3"
	on:dragstart|preventDefault
>
	<div
		class="w-full min-w-full max-w-full box-border cursor-pointer border-[6px] hover:border-zinc-600 {imgClasses}"
		on:click={onClick}
		style="min-height: {height}px"
		bind:this={wrapper}
	/>
	{page.index + 1}
</div>
