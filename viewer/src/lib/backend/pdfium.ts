import type { PdfBackend, PdfDocument, PdfPage } from './backend';
import * as Comlink from 'comlink';
import type { RenderResult } from './pdfium-worker';

export class PdfiumBackend implements PdfBackend {
	private workerBackend: any = null;

	async initialize(): Promise<void> {
		// importing it as non-module works like this:
		//new Worker(new URL('./pdfium-worker', import.meta.url));

		let PdfiumWorker = await import('./pdfium-worker?worker');
		let worker = new PdfiumWorker.default();
		let workerBackend = Comlink.wrap(worker) as any;
		this.workerBackend = await new workerBackend();
		await this.workerBackend.initialize();
	}

	async loadDocument(url: string): Promise<PdfDocument> {
		let worker = await this.workerBackend.loadDocument(url);
		return new PdfiumDocument(worker);
	}
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
		let worker = await this.worker.getPages();

		let result = [];
		let pages: number = await worker.length;
		for (let i = 0; i < pages; i++) {
			let ar = await worker[i].aspectRatio;
			result[i] = new PdfiumPage(i, worker[i], ar);
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
	private epoch: number = 0;

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
		let epoch = ++this.epoch;

		let result: RenderResult = await this.worker.render(width);
		if (result == null || this.epoch != epoch) return;
		let ctx = this.canvas!.getContext('2d')!;
		this.canvas.style.transform = '';
		this.canvas.width = result.width;
		this.canvas.height = result.height;
		ctx.putImageData(result.imageData, 0, 0, 0, 0, result.width, result.height);
	}

	async resized(width: number): Promise<void> {
		if (this.canvas == null) return;
		let scale = width / this.canvas.width;
		this.canvas.style.transformOrigin = `0 0`;
		this.canvas.style.transform = `scale(${scale})`;
	}
}
