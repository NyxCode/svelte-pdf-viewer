import type { PdfBackend, PdfDocument, PdfPage } from './backend';
import init, { initialize_pdfium_render, PdfiumWasmDocument, PdfiumWasmRenderer } from 'pdfium';

declare var Module: any;

export class PdfiumBackend implements PdfBackend {
	private renderer: PdfiumWasmRenderer | null = null;

	constructor() {}

	async initialize(): Promise<void> {
		let pdfiumModule = await initPdfium();
		console.log('pdfium runtime initialized');
		let initOut = await init();
		console.log('wasm glue initialized');
		initialize_pdfium_render(pdfiumModule, initOut, false);
		console.log('pdfium initialized');
		this.renderer = new PdfiumWasmRenderer();
		console.log('renderer created');
	}

	async loadDocument(url: string): Promise<PdfDocument> {
		let blob = await fetch(url).then((r) => r.blob());
		let array = new Uint8Array(await blob.arrayBuffer());
		console.log('loading document..');
		let doc = this.renderer!.load_document(array);
		console.log('creating PdfiumDocument');
		let res = new PdfiumDocument(doc);
		console.log('created PdfiumDocument');
		return res;
	}
}

function initPdfium(): Promise<any> {
	let resolve: (pdfiumModule: any) => void;
	let promise = new Promise((_resolve, _reject) => {
		resolve = _resolve;
	});

	let script = document.createElement('script');
	script.onload = () => {
		console.log('pdfium script loaded');
		Module.onRuntimeInitialized = () => {
			resolve(Module);
		};
	};
	script.src = '/pdfium.js';
	document.head.appendChild(script);

	return promise;
}

export class PdfiumDocument implements PdfDocument {
	private readonly doc: PdfiumWasmDocument;
	private readonly pages: number;

	constructor(doc: PdfiumWasmDocument) {
		this.doc = doc;
		this.pages = this.doc.pages();
	}

	async download(): Promise<void> {
		alert('not implemented');
	}

	async getPages(): Promise<PdfPage[]> {
		return Array.from(Array(this.pages).keys()).map((i) => new PdfiumPage(i, this.doc));
	}

	async print(): Promise<void> {
		alert('not implemented');
	}

	async getThumbnails(): Promise<PdfPage[]> {
		return Array.from(Array(this.pages).keys()).map((i) => new PdfiumPage(i, this.doc));
	}
}

export class PdfiumPage implements PdfPage {
	readonly aspectRatio: number;
	private readonly index: number;
	private readonly doc: PdfiumWasmDocument;
	private canvas: HTMLCanvasElement | null = null;

	constructor(index: number, doc: PdfiumWasmDocument) {
		this.index = index;
		this.doc = doc;
		let size = doc.page_size(index);
		this.aspectRatio = size.width / size.height;
	}

	async initialize(element: HTMLDivElement): Promise<void> {
		let label = `PdfiumPage (${this.index}): initialize`;
		console.time(label);
		element.innerHTML = '';
		this.canvas = document.createElement('canvas');
		element.appendChild(this.canvas);
		console.timeEnd(label);
	}

	async render(width: number): Promise<void> {
		let label = `PdfiumPage (${this.index}): render`;
		console.time(label);
		this.doc.render_page(
			this.index,
			width,
			(buffer: Uint8ClampedArray, width: number, height: number) => {
				let ctx = this.canvas!.getContext('2d')!;
				let imageData = new ImageData(buffer, width, height);
				ctx.putImageData(imageData, 0, 0);
			}
		);
		console.timeEnd(label);
	}

	async resized(width: number): Promise<void> {
		if (this.canvas == null) return;
		let label = `PdfiumPage (${this.index}): resized`;
		console.time(label);
		this.canvas.width = width;
		this.canvas.height = width / this.aspectRatio;
		console.timeEnd(label);
	}
}
