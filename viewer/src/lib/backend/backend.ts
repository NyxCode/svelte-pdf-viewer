export interface PdfBackend {
	loadDocument(url: string): Promise<PdfDocument>;
	initialize(): Promise<void>;
}

export interface PdfDocument {
	getPages(): Promise<PdfPage[]>;
	getThumbnails(): Promise<PdfPage[]>;
	download(): Promise<void>;
	print(): Promise<void>;
}

export interface PdfPage {
	// called once when the page is initialized.
	// No rendering should take place here.
	initialize(element: HTMLDivElement, width: number): Promise<void>;

	// called when the page should be rendered.
	// This happens when the page is visible, and was not previously rendered at the requested resolution.
	render(width: number): Promise<void>;

	// called when the page was resized.
	// This does not imply that the page should be re-rendered - If it should, `render()` will be called separately.
	resized(width: number): Promise<void>;

	readonly aspectRatio: number;
}
