# svelte-pdf-viewer

> :warning: very experimental - **here be dragons**

## [demo](https://svelte-pdf-viewer.nyxcode.com/)

## supported renderers
- [x] **Pdfium** *(using WASM through [pdfium-render](https://github.com/ajrcarey/pdfium-render))*
- [ ] **PDF.js**

## why is it so slow?
- [x] only render visible pages
- [ ] only render visible thumbnails
- [ ] only render visible parts of pages when zooming
- [ ] pdfium: re-use bitmap buffer
- [x] pdfium: render asynchronous in a webworker
- [ ] pdfium: pre-load pdfium
- [ ] preemptively render pages / thumbnails
- [ ] preload PDF

## todo
- [ ] text layer
- [ ] Display title or filename
- [ ] download
- [ ] print
- [ ] rotate
- [ ] progress bar
- [ ] document details
- [ ] side-by-side view
- [ ] full-screen / presentation mode
- [ ] profiling
- [ ] publish package
- [ ] plug-and-play renderers
- [ ] make extendable 
- [ ] annotations

## bugs
- [x] thumbnails sometimes render at the wrong size