import init, { initialize_pdfium_render, PdfiumWasmDocument, PdfiumWasmRenderer } from 'pdfium';
import * as Comlink from 'comlink';
import pdfium from './pdfium-js.js';

const MAX_WIDTH = 3000;
const MAX_HEIGHT = 3000;

function getWasmTable(pdfium: { wasmTable: () => any }): Promise<any> {
	return new Promise((resolve, reject) => {
		let max = 10000;
		let duration = 10;
		let waited = 0;

		let interval = setInterval(() => {
			let wasmTable = pdfium.wasmTable();
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
		(<any>self).wasmTable = await getWasmTable(pdfium);

		let initOut = await init();
		initialize_pdfium_render(pdfium.Module, initOut, false);
		this.renderer = new PdfiumWasmRenderer(MAX_WIDTH, MAX_HEIGHT);
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

	render(width: number): RenderResult {
		width = Math.floor(width);
		let height = Math.floor(width / this.aspectRatio);

		console.error('rendering page', this.index);

		if (width > MAX_WIDTH || height > MAX_HEIGHT) {
			console.error('aboring render, too big');
			return null;
		}

		let result = null;
		this.doc.render_page(
			this.index,
			width,
			(buffer: Uint8ClampedArray, buffer_width: number, _buffer_height: number) => {
				//let buffer_part = buffer.subarray(0, buffer_width * this.height * 4);
				let buffer_part = buffer.slice(0, buffer_width * height * 4);
				let imageData = new ImageData(buffer_part, buffer_width, height);

				result = {
					imageData,
					width,
					height,
					index: this.index
				};
			}
		);
		return result;
	}
}

export type RenderResult = {
	imageData: ImageData;
	width: number;
	height: number;
	index: number;
} | null;

Comlink.expose(PdfiumWorkerBackend);
