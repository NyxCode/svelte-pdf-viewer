/* tslint:disable */
/* eslint-disable */
/**
* Establishes a binding between an external Pdfium WASM module and `pdfium-render`'s WASM module.
* This function should be called from Javascript once the external Pdfium WASM module has been loaded
* into the browser. It is essential that this function is called _before_ initializing
* `pdfium-render` from within Rust code. For an example, see:
* <https://github.com/ajrcarey/pdfium-render/blob/master/examples/index.html>
* @param {any} pdfium_wasm_module
* @param {any} local_wasm_module
* @param {boolean} debug
* @returns {boolean}
*/
export function initialize_pdfium_render(pdfium_wasm_module: any, local_wasm_module: any, debug: boolean): boolean;
/**
* A callback function that can be invoked by Pdfium's `FPDF_LoadCustomDocument()` function,
* wrapping around `crate::utils::files::read_block_from_callback()` to shuffle data buffers
* from our WASM memory heap to Pdfium's WASM memory heap as they are loaded.
* @param {number} param
* @param {number} position
* @param {number} pBuf
* @param {number} size
* @returns {number}
*/
export function read_block_from_callback_wasm(param: number, position: number, pBuf: number, size: number): number;
/**
* A callback function that can be invoked by Pdfium's `FPDF_SaveAsCopy()` and `FPDF_SaveWithVersion()`
* functions, wrapping around `crate::utils::files::write_block_from_callback()` to shuffle data buffers
* from Pdfium's WASM memory heap to our WASM memory heap as they are written.
* @param {number} param
* @param {number} buf
* @param {number} size
* @returns {number}
*/
export function write_block_from_callback_wasm(param: number, buf: number, size: number): number;
/**
*/
export class PdfiumWasmDocument {
  free(): void;
/**
* @returns {Float64Array}
*/
  aspect_ratios(): Float64Array;
/**
* @param {number} n
* @param {number} width_px
* @returns {Uint8ClampedArray}
*/
  render_page(n: number, width_px: number): Uint8ClampedArray;
}
/**
*/
export class PdfiumWasmRenderer {
  free(): void;
/**
* @param {number} max_width
* @param {number} max_height
*/
  constructor(max_width: number, max_height: number);
/**
* @param {Uint8Array} bytes
* @returns {PdfiumWasmDocument}
*/
  load_document(bytes: Uint8Array): PdfiumWasmDocument;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_pdfiumwasmrenderer_free: (a: number) => void;
  readonly pdfiumwasmrenderer_new: (a: number, b: number, c: number) => void;
  readonly pdfiumwasmrenderer_load_document: (a: number, b: number, c: number, d: number) => void;
  readonly __wbg_pdfiumwasmdocument_free: (a: number) => void;
  readonly pdfiumwasmdocument_aspect_ratios: (a: number, b: number) => void;
  readonly pdfiumwasmdocument_render_page: (a: number, b: number, c: number, d: number) => void;
  readonly initialize_pdfium_render: (a: number, b: number, c: number) => number;
  readonly read_block_from_callback_wasm: (a: number, b: number, c: number, d: number) => number;
  readonly write_block_from_callback_wasm: (a: number, b: number, c: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
}

/**
* Synchronously compiles the given `bytes` and instantiates the WebAssembly module.
*
* @param {BufferSource} bytes
*
* @returns {InitOutput}
*/
export function initSync(bytes: BufferSource): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
