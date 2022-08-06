export interface PdfBackend {
	loadDocument(url: string): Promise<PdfDocument>;
}

export interface PdfDocument {
	getPages(): Promise<PdfPage[]>;
	getPage(index: number): Promise<PdfPage>;
	download(): Promise<void>;
	print(): Promise<void>;
}

export interface PdfPage {
	initialize(element: HTMLDivElement): Promise<void>;
	render(): Promise<void>;
}
