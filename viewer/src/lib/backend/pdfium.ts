import type { PdfBackend, PdfDocument, PdfPage } from './backend';
import init, { initialize_pdfium_render, PdfiumWasmDocument, PdfiumWasmRenderer } from 'pdfium';
import { browser } from '$app/env';
import * as Comlink from 'comlink';

declare var Module: any;

export class PdfiumBackend implements PdfBackend {
	private renderer: PdfiumWasmRenderer | null = null;
	private workerBackend: any = null;

	constructor() {
		console.error('BROWSER:', browser);
	}

	async initialize(): Promise<void> {
		console.time('PdfiumBackend: initialize');

		// !non-module!
		//new Worker(new URL('./pdfium-worker', import.meta.url));

		// !Module!
		let PdfiumWorker = await import('./pdfium-worker?worker');
		let worker = new PdfiumWorker.default();
		let workerBackend = Comlink.wrap(worker);
		this.workerBackend = await new workerBackend();
		await this.workerBackend.initialize();
		/*
		console.warn('A', workerBackend);
		let instance = await new workerBackend();
		console.warn('B', instance);
		console.warn('C', await instance.initialize());
		let doc = await instance.loadDocument('/example.pdf');
		console.warn('D', doc);
		let pages = await doc.getPages();
		console.warn('E', pages);
		let page = pages[0];
		console.warn('F', page);
		console.warn('G', await page.render(100));
		
		 */

		let pdfiumModule = await initPdfium();
		let initOut = await init();
		initialize_pdfium_render(pdfiumModule, initOut, false);
		this.renderer = new PdfiumWasmRenderer();

		console.timeEnd('PdfiumBackend: initialize');
	}

	async loadDocument(url: string): Promise<PdfDocument> {
		console.time('PdfiumBackend: loadDocument');
		let worker = await this.workerBackend.loadDocument(url);
		let res = new PdfiumDocument(worker);
		console.timeEnd('PdfiumBackend: loadDocument');
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
	private readonly worker: any;

	constructor(worker: any) {
		this.worker = worker;
	}

	async download(): Promise<void> {
		alert('not implemented');
	}

	async getPages(): Promise<PdfPage[]> {
		console.time('PdfiumDocument: getPages');
		let worker = await this.worker.getPages();

		let result = [];
		let pages: number = await worker.length;
		for (let i = 0; i < pages; i++) {
			let ar = await worker[i].aspectRatio;
			let mapped = new PdfiumPage(i, worker[i], ar);
			result[i] = mapped;
		}

		return result;
	}

	async print(): Promise<void> {
		alert('not implemented');
	}

	async getThumbnails(): Promise<PdfPage[]> {
		return this.getPages();
	}
}

export class PdfiumPage implements PdfPage {
	private readonly worker: any;
	private readonly index: number;
	private canvas: HTMLCanvasElement | null = null;
	readonly aspectRatio: number;

	private lastRender: number = 0;

	constructor(index: number, worker: any, aspectRatio: number) {
		this.worker = worker;
		this.index = index;
		this.aspectRatio = aspectRatio;
	}

	async initialize(element: HTMLDivElement): Promise<void> {
		element.innerHTML = '';
		this.canvas = document.createElement('canvas');
		element.appendChild(this.canvas);
	}

	async render(width: number): Promise<void> {
		if (this.canvas == null) return;
		this.lastRender++;
		let epoch = this.lastRender;

		let imageData: ImageData = await this.worker.render(width);
		if (epoch < this.lastRender) {
			console.error("aborting render, it's old");
			return;
		}
		let ctx = this.canvas!.getContext('2d')!;
		this.canvas.style.transform = '';
		this.canvas.width = imageData.width;
		this.canvas.height = imageData.height;
		ctx.putImageData(imageData, 0, 0);
	}

	async resized(width: number): Promise<void> {
		if (this.canvas == null) return;
		let label = `PdfiumPage (${this.index}): resized`;
		let scale = width / this.canvas.width;
		this.canvas.style.transformOrigin = `0 0`;
		this.canvas.style.transform = `scale(${scale})`;
		// this.canvas.width = width;
		// this.canvas.height = width / this.aspectRatio;
	}
}
