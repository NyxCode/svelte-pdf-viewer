import type { Writable } from 'svelte/store';
import type { PdfDocument, PdfPage } from './backend/backend';
import type Page from './Page.svelte';

export interface PageData {
	index: number;

	element: HTMLDivElement | null;
	thumbnailElement: HTMLDivElement | null;
	component: Page;

	pdfPage: PdfPage;
	pdfThumbnail: PdfPage;
}

export interface Context {
	document: Writable<PdfDocument>;

	pages: Writable<PageData[]>;
	currentPage: Writable<number>;
	shouldLoad: Writable<Set<number>>;

	pageWidth: Writable<number>;
	drawerWidth: number;
}
