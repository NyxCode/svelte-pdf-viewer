<script lang="ts">
	import type { Context, PageData } from './types';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import { CONTEXT } from './utils';
	import { CurrentPageObserver } from './observers';

	const width = 180;

	export let page: PageData;
	export let visibilityObserver: CurrentPageObserver;
	export let shouldRender: boolean;

	let { currentPage } = getContext<Context>(CONTEXT);
	let dispatch = createEventDispatcher();

	let wrapper: HTMLDivElement;
	let rendered = false;

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

	function onClick(e: MouseEvent) {
		dispatch('goto', { page: page.index });
	}

	$: if (shouldRender && !rendered) {
		page.pdfThumbnail.render(width);
		rendered = true;
	}

	onMount(async () => {
		visibilityObserver.observe(page.thumbnailElement);

		await page.pdfThumbnail.initialize(wrapper, width);

		return () => visibilityObserver.unobserve(page.thumbnailElement);
	});
</script>

<div
	data-page-index={page.index}
	bind:this={page.thumbnailElement}
	class="text-center text-zinc-100 text-lg px-8 py-3 select-none"
	on:dragstart|preventDefault
>
	<div
		{style}
		class="box-content cursor-pointer border-[6px] w-[192px] hover:border-zinc-600 transition-colors {imgClasses}"
		on:click={onClick}
		bind:this={wrapper}
	/>
	{page.index + 1}
</div>
