import type { Writable } from 'svelte/store';
import type { SimpleResizeObserver } from './observers';
import type { PdfDocument } from './backend/backend';
import type Page from './Page.svelte';

export interface PageData {
	index: number;
	element: HTMLDivElement | null;
	thumbnailUrl: string | null;
	thumbnailElement: HTMLDivElement | null;
	aspectRatio: number;
	component: Page;
}

export interface Context {
	document: PdfDocument;

	pages: Writable<PageData[]>;
	currentPage: Writable<number>;
	shouldLoad: Writable<Set<number>>;

	pageWidth: Writable<number>;
	drawerWidth: number;

	resizeObserver: SimpleResizeObserver;
}
