import type { PdfBackend, PdfDocument, PdfPage } from '../backend/backend';
import type { WorkerMessages } from './worker';
import EventBus from '../event-bus';

export class PdfiumBackend implements PdfBackend {
	private eventBus: EventBus<WorkerMessages.Response> = new EventBus<WorkerMessages.Response>();
	private worker: Worker | null = null;
	private nextMessageId: number = 0;

	async initialize(): Promise<void> {
		let PdfiumWorker = await import('./worker?worker');
		this.worker = new PdfiumWorker.default();
		this.worker.onmessage = (msg) => this.eventBus.send(msg.data);
	}

	async loadDocument(url: string): Promise<PdfDocument> {
		const blob = await fetch(url)
			.then((r) => r.blob())
			.then((b) => b.arrayBuffer());

		let response = <WorkerMessages.LoadResponse>(
			await this.sendMessage<WorkerMessages.LoadBlobRequest>({
				data: new Uint8Array(blob),
				type: 'load-blob'
			})
		);

		return new PdfiumDocument(this, response);
	}

	async sendMessage<R extends WorkerMessages.Request>(
		request: Omit<R, 'id'>
	): Promise<WorkerMessages.Response> {
		let req = { ...request, id: this.nextMessageId++ } as R;
		return new Promise<WorkerMessages.Response>((resolve, _reject) => {
			let id = this.eventBus.on((value) => {
				if (value.id == req.id) {
					this.eventBus.remove(id);
					resolve(value);
				}
			});
			this.worker!.postMessage(req);
		});
	}
}

export class PdfiumDocument implements PdfDocument {
	private readonly backend: PdfiumBackend;
	private readonly aspectRatios: number[];

	constructor(backend: PdfiumBackend, r: WorkerMessages.LoadResponse) {
		this.backend = backend;
		this.aspectRatios = r.aspectRatios;
	}

	async download(): Promise<void> {
		alert('not implemented');
	}

	async getPages(): Promise<PdfPage[]> {
		return this.aspectRatios.map((ratio, index) => new PdfiumPage(this.backend, index, ratio));
	}

	async print(): Promise<void> {
		alert('not implemented');
	}

	async getThumbnails(): Promise<PdfPage[]> {
		return this.aspectRatios.map((ratio, index) => new PdfiumThumbnail(this.backend, index, ratio));
	}
}

export class PdfiumPage implements PdfPage {
	private readonly backend: PdfiumBackend;
	private readonly page: number;
	protected readonly context: number = 0;
	private canvas: HTMLCanvasElement | null = null;

	readonly aspectRatio: number;

	private width: number = -Infinity;
	private get height() {
		return Math.floor(this.width / this.aspectRatio);
	}
	private get pixelWidth() {
		return this.width * (window.devicePixelRatio || 1);
	}
	private get pixelHeight() {
		return this.height * (window.devicePixelRatio || 1);
	}

	constructor(backend: PdfiumBackend, page: number, aspectRatio: number) {
		this.backend = backend;
		this.page = page;
		this.aspectRatio = aspectRatio;
	}

	async initialize(element: HTMLDivElement, width: number): Promise<void> {
		element.innerHTML = '';
		this.canvas = document.createElement('canvas');
		this.canvas.style.transformOrigin = `0 0`;

		this.canvas.classList.add('bg-white', 'animate-pulse');

		this.width = width;
		this.setCanvasSize();

		element.appendChild(this.canvas);
	}

	private setCanvasSize() {
		this.canvas!.style.width = this.width + 'px';
		this.canvas!.style.height = this.height + 'px';
		this.canvas!.width = this.pixelWidth;
		this.canvas!.height = this.pixelHeight;
	}

	async render(): Promise<void> {
		if (this.canvas == null) return;

		let result = <WorkerMessages.RenderPageResponse>(
			await this.backend.sendMessage<WorkerMessages.RenderPageRequest>({
				type: 'render-page',
				context: this.context,
				page: this.page,
				width: this.pixelWidth
			})
		);

		requestAnimationFrame(() => {
			if (!result.ok) {
				console.warn('Render aborted:', result.error);
				return;
			}
			if (Math.abs(this.pixelWidth - result.width) > Number.EPSILON) {
				console.info("Ignoring render, it's outdated");
				return;
			}

			this.canvas!.className = '';

			let ctx = this.canvas!.getContext('2d')!;
			this.canvas!.style.transform = '';
			this.setCanvasSize();
			ctx.putImageData(result.data, 0, 0, 0, 0, result.width, result.height);
		});
	}

	async resized(width: number): Promise<void> {
		if (this.canvas == null) return;
		width = Math.floor(width);
		let scale = width / (this.canvas.width / (window.devicePixelRatio || 1));
		this.canvas.style.transform = `scale(${scale})`;
		this.width = Math.floor(width);
	}
}

class PdfiumThumbnail extends PdfiumPage {
	protected override readonly context: number = 1;
}
