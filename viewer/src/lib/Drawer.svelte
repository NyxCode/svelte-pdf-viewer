<script lang="ts">
	import { CONTEXT, slide } from './utils';
	import { getContext } from 'svelte';
	import type { Context } from './types';
	import Thumbnail from './Thumbnail.svelte';

	const { pages, drawerWidth, currentPage } = getContext<Context>(CONTEXT);
	const style = `
	  width: ${drawerWidth}em;
	  min-width: ${drawerWidth}em;
	  max-width: ${drawerWidth}em;
  `;

	let wrapper: HTMLDivElement;

	let lastCurrent = $currentPage;
	$: {
		ensureInView($currentPage);
		lastCurrent = $currentPage;
	}

	function ensureInView(current: number) {
		if (wrapper == null) return;
		let thumbnail = $pages[current].thumbnailElement;
		if (thumbnail == null) return;

		let overflowTop = thumbnail.offsetTop < wrapper.scrollTop;
		let overflowBottom =
			thumbnail.offsetTop + thumbnail.offsetHeight > wrapper.scrollTop + wrapper.offsetHeight;
		let overflow = overflowTop || overflowBottom;

		if (!overflow) return;

		if (current > lastCurrent) {
			// scrolled down
			wrapper.scrollTop = thumbnail.offsetTop + thumbnail.offsetHeight - wrapper.offsetHeight;
		} else {
			// scrolled up
			wrapper.scrollTop = thumbnail.offsetTop;
		}
	}
</script>

<div transition:slide={{ em: drawerWidth }} {style} class="overflow-hidden">
	<div
		bind:this={wrapper}
		class="h-full w-full overflow-auto thumbnails-scrollbar scroll-smooth
					 bg-zinc-800 drop-shadow-lg z-10 pl-[16px]"
	>
		{#each $pages as page}
			<Thumbnail on:goto {page} />
		{/each}
	</div>
</div>
