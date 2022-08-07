<script lang="ts">
	import { default as Page } from './Page.svelte';
	import { getContext, onMount, tick } from 'svelte';
	import { clamp, CONTEXT, getScrollRatio, setScrollRatio, withoutClass } from './utils';
	import type { Context } from './types';
	import { CurrentPageObserver } from './observers';

	let wrapper: HTMLDivElement;
	let currentPageObserver: CurrentPageObserver;
	let { pages, currentPage, shouldLoad, pageWidth } = getContext<Context>(CONTEXT);

	export function goto(page: number, hard: boolean = false) {
		let nth = wrapper.children.item(page)! as HTMLDivElement;
		let margin = parseFloat(getComputedStyle(nth).marginTop);
		const doScroll = () => (wrapper.scrollTop = nth.offsetTop - margin);

		if (hard || Math.abs(page - $currentPage) > 3) {
			withoutClass(wrapper, 'scroll-smooth', doScroll);
		} else {
			doScroll();
		}
	}

	export async function zoom(deltaY: number) {
		let relScrollY = getScrollRatio(wrapper, 'y');
		$pageWidth = clamp($pageWidth - deltaY, { min: 50, max: 50000 });
		await tick();
		$pages.forEach((p) => p.component.resize());

		withoutClass(wrapper, 'scroll-smooth', () => {
			setScrollRatio(wrapper, relScrollY, 'y');
			setScrollRatio(wrapper, 0.5, 'x');
		});
	}

	onMount(() => {
		currentPageObserver = new CurrentPageObserver(wrapper, currentPage, shouldLoad);

		return () => currentPageObserver.destroy();
	});
</script>

<div
	bind:this={wrapper}
	class="flex flex-col w-full max-w-full overflow-auto pages-scrollbar scroll-smooth"
>
	{#if currentPageObserver != null}
		{#each $pages as page}
			<Page bind:this={page.component} bind:page {currentPageObserver} />
		{/each}
	{/if}
</div>
