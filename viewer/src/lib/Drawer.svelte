<script lang="ts">
	import { CONTEXT, slide } from './utils';
	import { getContext, onMount } from 'svelte';
	import type { Context } from './types';
	import Thumbnail from './Thumbnail.svelte';
	import { CurrentPageObserver } from './observers';
	import { writable } from 'svelte/store';

	const { pages, drawerWidth, currentPage } = getContext<Context>(CONTEXT);
	const shouldLoad = writable(new Set());

	let wrapper: HTMLDivElement;
	let visibilityObserver: CurrentPageObserver;

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

	onMount(() => {
		visibilityObserver = new CurrentPageObserver(wrapper, writable(0), shouldLoad);

		() => visibilityObserver.destroy();
	});
</script>

<div
	transition:slide={{ em: drawerWidth }}
	style:width="{drawerWidth}em"
	style:min-width="{drawerWidth}em"
	style:max-width="{drawerWidth}em"
	class="overflow-hidden"
>
	<div
		bind:this={wrapper}
		class="h-full w-full overflow-auto thumbnails-scrollbar scroll-smooth
					 bg-zinc-800 drop-shadow-lg z-10 pl-[16px]"
	>
		{#if visibilityObserver != null}
			{#each $pages as page (page.index)}
				<Thumbnail on:goto {page} {visibilityObserver} shouldRender={$shouldLoad.has(page.index)} />
			{/each}
		{/if}
	</div>
</div>
