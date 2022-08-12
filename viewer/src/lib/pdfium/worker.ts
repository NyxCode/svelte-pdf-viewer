import { debounce, Deferred } from '../utils';
import init, { initialize_pdfium_render, PdfiumWasmDocument, PdfiumWasmRenderer } from 'pdfium';
import pdfium from './pdfium-js.js';

const DEBOUNCE_TIME = 10;
const [BUFFER_WIDTH, BUFFER_HEIGHT] = [5000, 7072];
const renderer: Deferred<PdfiumWasmRenderer> = Deferred.fromPromise(loadRenderer());
const document: Deferred<PdfiumWasmDocument> = new Deferred<PdfiumWasmDocument>();

let aspectRatios: number[] = [];
let stack: WorkerMessages.Request[] = [];

onmessage = async function (e) {
	let request = e.data as WorkerMessages.Request;
	stack.push(request);
	processQueue();
};

const processQueue = debounce(async () => {
	let next = stack.pop();
	if (next == null) return;
	filterQueue(next);
	await processRequest(next);
	processQueue();
}, DEBOUNCE_TIME);

async function processRequest(req: WorkerMessages.Request) {
	switch (req.type) {
		case 'render-page':
			render(req).then(postMessage);
			break;
		case 'load-blob':
			loadBlob(req).then(postMessage);
			break;
	}
}

function filterQueue(next: WorkerMessages.Request) {
	if (next.type != 'render-page') return;

	let before = stack.length;
	stack = stack.filter(
		(t) => t.type != 'render-page' || t.page != next.page || t.context != next.context
	);

	if (before > stack.length) {
		console.info('Discarded', before - stack.length, 'tasks 🥳');
	}
}

async function loadBlob(t: WorkerMessages.LoadBlobRequest): Promise<WorkerMessages.LoadResponse> {
	const render = await renderer.promise();
	const doc = render.load_document(t.data);

	document.set(doc);
	aspectRatios = Array.from(doc.aspect_ratios());

	return { id: t.id, aspectRatios };
}

async function render(
	t: WorkerMessages.RenderPageRequest
): Promise<WorkerMessages.RenderPageResponse> {
	const doc = await document.promise();
	const aspect = aspectRatios[t.page];
	const height = Math.floor(t.width / aspect);
	if (t.width > BUFFER_WIDTH || height > BUFFER_HEIGHT) {
		return { id: t.id, ok: false, error: 'too-big' };
	}

	const buffer = doc.render_page(t.page, t.width);
	const byte_len = BUFFER_WIDTH * height * 4;

	return {
		id: t.id,
		data: new ImageData(buffer.slice(0, byte_len), BUFFER_WIDTH, height),
		width: t.width,
		height,
		ok: true
	};
}

export namespace WorkerMessages {
	export type Request = LoadBlobRequest | RenderPageRequest;
	export type Response = LoadResponse | RenderPageResponse;
	export type Message = Request | Response;

	export interface LoadBlobRequest {
		id: number;
		type: 'load-blob';
		data: Uint8Array;
	}

	export interface LoadResponse {
		id: number;
		aspectRatios: number[];
	}

	export interface RenderPageRequest {
		id: number;
		type: 'render-page';
		context: number;
		page: number;
		width: number;
	}

	export type RenderPageResponse =
		| {
				id: number;
				data: ImageData;
				width: number;
				height: number;
				ok: true;
		  }
		| {
				id: number;
				error: 'too-big';
				ok: false;
		  };
}

export {};

async function loadRenderer() {
	let [wasmTable, wasmModule] = await Promise.all([findWasmTable(), init()]);

	(<any>self).wasmTable = wasmTable;
	initialize_pdfium_render(pdfium.Module, wasmModule, false);
	return new PdfiumWasmRenderer(BUFFER_WIDTH, BUFFER_HEIGHT);
}

function findWasmTable(): Promise<any> {
	return new Promise((resolve) => {
		let interval = setInterval(() => {
			let wasmTable = pdfium.wasmTable();
			if (wasmTable != undefined) {
				clearInterval(interval);
				console.info(`'wasmTable' found, pdfium.js is ready`);
				resolve(wasmTable);
			}
		}, 10);
	});
}
