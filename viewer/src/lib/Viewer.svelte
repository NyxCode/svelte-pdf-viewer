<script lang="ts">
	import Toolbar from './Toolbar.svelte';
	import Drawer from './Drawer.svelte';
	import { default as Document } from './Document.svelte';
	import { CONTEXT } from './utils';
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Context, PageData } from './types';
	import { SimpleResizeObserver } from './observers';
	import { browser } from '$app/env';
	import { MockBackend } from './backend/mock';

	let drawer = true;
	let documentWidget: Document;
	let wrapper: HTMLElement;

	const pageWidth = writable(500);
	const currentPage = writable(0);
	const backend = new MockBackend();

	let ctx: Context = {
		pages: writable(
			Array.from(Array(24).keys()).map(
				(index) =>
					({
						index,
						element: null,
						thumbnailUrl: null,
						thumbnailElement: null,
						aspectRatio: 1.41,
						component: null!
					} as PageData)
			)
		),
		currentPage,
		drawerWidth: 18,
		pageWidth,
		resizeObserver: browser ? new SimpleResizeObserver() : null!,
		document: null!,
		shouldLoad: writable(new Set())
	};
	setContext<Context>(CONTEXT, ctx);

	onMount(async () => {
		$pageWidth = wrapper.offsetWidth * 0.66;
		ctx.document = await backend.loadDocument('/');
	});

	function goto({ detail: { page, hard } }: { detail: { page: number; hard: true } }) {
		documentWidget.goto(page, hard);
	}

	function zoom(e: WheelEvent) {
		if (!e.ctrlKey) return;
		e.preventDefault();

		documentWidget.zoom(e.deltaY);
	}
</script>

<div
	class="h-full w-full bg-zinc-700 flex flex-col max-h-full overflow-clip"
	on:wheel|nonpassive={zoom}
	bind:this={wrapper}
>
	<Toolbar bind:drawer on:goto={goto} />
	{#if ctx.document != null}
		<div class="flex flex-row transition-all overflow-hidden relative">
			{#if drawer}
				<Drawer on:goto={goto} />
			{/if}
			<Document bind:this={documentWidget} />
		</div>
	{/if}
</div>
