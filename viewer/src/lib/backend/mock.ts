import type { PdfBackend, PdfDocument, PdfPage } from './backend';

export class MockBackend implements PdfBackend {
	async loadDocument(_url: string): Promise<PdfDocument> {
		return new MockPdfDocument();
	}
}

export class MockPdfDocument implements PdfDocument {
	async getPages(): Promise<PdfPage[]> {
		throw new Error("unimplemented")
	}
	async download(): Promise<void> {
		throw new Error("unimplemented")
	}
	async print(): Promise<void> {
		throw new Error("unimplemented")
	}
	async getPage(index: number): Promise<PdfPage> {
		console.log("renderer: get page", index);
		return new MockPdfPage()
	}
}

export class MockPdfPage implements PdfPage {
	async initialize(element: HTMLDivElement): Promise<void> {
		if (!element) return;
		let img = document.createElement('img');
		img.src = '/largepreview.png';
		img.classList.add('h-full', 'w-full');
		element.appendChild(img);
	}

	async render(): Promise<void> {}
}
