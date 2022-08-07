# svelte-pdf-viewer

> :warning: very experimental - **here be dragons**

## [demo](https://svelte-pdf-viewer.nyxcode.com/)

## supported renderers
- [x] **Pdfium** *(using WASM through [pdfium-render](https://github.com/ajrcarey/pdfium-render))*
- [ ] **PDF.js**

## supported browsers
- [x] **Chrome**
- [ ] **Firefox** *(currently crashes after a few renders, possible due to a memory leak)*

## why is it so slow?
- [x] only render visible pages
- [ ] only render visible thumbnails
- [ ] only render visible parts of pages when zooming
- [ ] pdfium: re-use bitmap buffer
- [ ] implement rendering queue to discard outdated requests
- [x] pdfium: render asynchronous in a webworker
- [ ] pdfium: pre-load pdfium
- [ ] preemptively render pages / thumbnails
- [ ] preload PDF

## todo
- [ ] text layer
- [ ] display title or filename
- [ ] download
- [ ] loading animation/indicator
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
- [ ] streamline build [^1]

## bugs
- [x] thumbnails sometimes render at the wrong size
- [x] pages flicker on when zooming


[^1]:  Currently, getting the thing to build is a pain due to the emscripten-generated `pdfium-js.js` and `pdfium.wasm`.  
  `pdfium.wasm` is duplicated, once in `src/lib/backend/` and once in `/static/assets` since vite seems to be fine with 
  the first one (in dev), but rollup needs the 2nd one (when building).
