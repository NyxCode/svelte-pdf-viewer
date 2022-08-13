<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Context, PageData } from './types';
	import { CONTEXT } from './utils';
	import type { CurrentPageObserver } from './observers';

	export let page: PageData;
	export let currentPageObserver: CurrentPageObserver;

	const { pageWidth, shouldLoad } = getContext<Context>(CONTEXT);

	$: height = $pageWidth / page.pdfPage.aspectRatio;
	$: style = `
			width: ${$pageWidth}px;
			height: ${height}px;
			min-width: ${$pageWidth}px;
			min-height: ${height}px;
			max-width: ${$pageWidth}px;
			max-height: ${height}px;
		`;

	let rendered = false;
	$: shouldRender = $shouldLoad.has(page.index);

	export function resize() {
		if (page.element == null) return;
		page.element.style.cssText = style;
		page.pdfPage.resized($pageWidth);
		rendered = false;
	}

	$: if (shouldRender && !rendered) {
		page.pdfPage.render($pageWidth);
		rendered = true;
	}

	onMount(async () => {
		currentPageObserver.observe(page.element);
		await page.pdfPage.initialize(page.element!, $pageWidth);
		resize();

		return () => currentPageObserver?.unobserve(page.element);
	});
</script>

<div
	data-page-index={page.index}
	bind:this={page.element}
	class="mx-auto my-3 pl-[8px]"
	on:dragstart|preventDefault
/>
