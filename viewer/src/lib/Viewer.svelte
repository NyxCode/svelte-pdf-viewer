<script lang="ts">
	import Toolbar from './Toolbar.svelte';
	import Drawer from './Drawer.svelte';
	import { default as Document } from './Document.svelte';
	import { CONTEXT } from './utils';
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Context, PageData } from './types';
	import { PdfiumBackend } from './pdfium/pdfium';
	import type { PdfDocument } from './backend/backend';

	let drawer = true;
	let documentWidget: Document;
	let wrapper: HTMLElement;

	const pageWidth = writable(500);
	const currentPage = writable(0);
	const document = writable<PdfDocument>(null!);
	const backend = new PdfiumBackend();

	let ctx: Context = {
		pages: writable([]),
		currentPage,
		drawerWidth: 18,
		pageWidth,
		document,
		shouldLoad: writable(new Set())
	};
	setContext<Context>(CONTEXT, ctx);

	onMount(async () => {
		$pageWidth = wrapper.offsetWidth * 0.66;
		await backend.initialize();
		$document = await backend.loadDocument('/example.pdf');

		let pages = await $document.getPages();
		let thumbnails = await $document.getThumbnails();

		const makePage = (index: number) =>
			({
				index,
				element: null,
				thumbnailElement: null,
				component: null!,
				pdfPage: pages[index],
				pdfThumbnail: thumbnails[index]
			} as PageData);

		let pageData = Array.from(Array(pages.length).keys()).map(makePage);

		ctx.pages.set(pageData);
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
