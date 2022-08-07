import init, {
	initialize_pdfium_render,
	PdfiumWasmDocument,
	PdfiumWasmRenderer
} from '../../../../pdfium/pkg/pdfium';
import * as Comlink from 'comlink';

function timeout(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getWasmTable(): Promise<any> {
	return new Promise((resolve, reject) => {
		let max = 1000;
		let duration = 100;
		let waited = 0;

		let interval = setInterval(() => {
			let wasmTable = self['wasmTable'];
			if (wasmTable != undefined) {
				clearInterval(interval);
				console.error(`'wasmTable' found after ${waited}ms`);
				resolve(wasmTable);
			} else if (waited > max) {
				clearTimeout(interval);
				reject(`'wasmTable' not found, waited ${waited}ms`);
			}
			waited += duration;
		}, duration);
	});
}

class PdfiumWorkerBackend {
	private renderer: PdfiumWasmRenderer | null = null;

	constructor() {
		console.error('backend created:', self);
	}

	async initialize(): Promise<void> {
		let pdfium = (await import('./pdfium-js.js')).default;

		getWasmTable();

		await timeout(100);

		self.wasmTable = pdfium.wasmTable();
		let initOut = await init();
		initialize_pdfium_render(pdfium.Module, initOut, false);
		this.renderer = new PdfiumWasmRenderer();
		console.error('backend initialized!');
	}

	async loadDocument(url: string): Promise<PdfiumWorkerDocument> {
		let blob = await fetch(url).then((r) => r.blob());
		let array = new Uint8Array(await blob.arrayBuffer());
		let doc = this.renderer!.load_document(array);
		return Comlink.proxy(new PdfiumWorkerDocument(doc));
	}
}

class PdfiumWorkerDocument {
	private readonly doc: PdfiumWasmDocument;
	readonly pages: number;

	constructor(doc: PdfiumWasmDocument) {
		this.doc = doc;
		this.pages = this.doc.pages();
	}

	async getPages(): Promise<PdfiumWorkerPage[]> {
		let res = Array.from(Array(this.pages).keys()).map((i) => new PdfiumWorkerPage(i, this.doc));
		return Comlink.proxy(res);
	}

	async getThumbnails(): Promise<PdfiumWorkerPage[]> {
		return this.getPages();
	}
}

class PdfiumWorkerPage {
	readonly aspectRatio: number;
	private readonly index: number;
	private readonly doc: PdfiumWasmDocument;

	constructor(index: number, doc: PdfiumWasmDocument) {
		this.index = index;
		this.doc = doc;
		let size = doc.page_size(index);
		this.aspectRatio = size.width / size.height;
	}

	render(width: number): Promise<ImageData> {
		console.error('rendering page', this.index);
		return new Promise((resolve, reject) => {
			this.doc.render_page(
				this.index,
				width,
				(buffer: Uint8ClampedArray, width: number, height: number) => {
					let imageData = new ImageData(buffer, width, height);
					resolve(imageData);
				}
			);
		});
	}
}

Comlink.expose(PdfiumWorkerBackend);
