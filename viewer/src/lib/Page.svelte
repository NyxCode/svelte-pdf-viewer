<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Context, PageData } from './types';
	import { CONTEXT } from './utils';
	import { CurrentPageObserver } from './observers';

	export let page: PageData;
	export let currentPageObserver: CurrentPageObserver;

	const { pageWidth, document } = getContext<Context>(CONTEXT);

	$: height = $pageWidth * (page.aspectRatio || 1.41421);
	$: style = `
			width: ${$pageWidth}px;
			height: ${height}px;
			min-width: ${$pageWidth}px;
			min-height: ${height}px;
			max-width: ${$pageWidth}px;
			max-height: ${height}px;
		`;

	$: currentPageObserver?.observe(page);

	export function resize() {
		if (page.element == null) return;
		page.element.style.cssText = style;
	}

	onMount(async () => {
		resize();
		let pdfPage = await document.getPage(page.index);
		await pdfPage.initialize(page.element!);
		await pdfPage.render();
	});
</script>

<div
	data-page-index={page.index}
	bind:this={page.element}
	class="mx-auto my-3"
	on:dragstart|preventDefault
/>
