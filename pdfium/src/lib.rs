use std::cell::RefCell;
use std::rc::Rc;
use js_sys::{Function, Uint8Array, Uint8ClampedArray};
use pdfium_render::bindings::PdfiumLibraryBindings;
use pdfium_render::bitmap::{PdfBitmap, PdfBitmapFormat};
use pdfium_render::error::PdfiumError;
use pdfium_render::page::PdfPage;
use pdfium_render::pdfium::Pdfium;
use pdfium_render::prelude::PdfDocument;
use pdfium_render::render_config::PdfRenderConfig;
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsValue;
use web_sys::Blob;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub type Result<T = ()> = std::result::Result<T, JsValue>;

#[wasm_bindgen]
pub struct PdfiumWasmRenderer {
    pdfium: &'static Pdfium,
    max_width: u16,
    max_height: u16,
    bitmap: Rc<RefCell<PdfBitmap<'static>>>
}

#[wasm_bindgen]
impl PdfiumWasmRenderer {
    #[wasm_bindgen(constructor)]
    pub fn new(max_width: u16, max_height: u16) -> Result<PdfiumWasmRenderer> {
        let bindings = Pdfium::bind_to_system_library().map_err(js_err)?;
        let pdfium: &'static Pdfium = Box::leak(Box::new(Pdfium::new(bindings)));

        let bitmap: PdfBitmap<'static> =
            PdfBitmap::empty(max_width, max_height, PdfBitmapFormat::default(), pdfium.get_bindings())
                .map_err(js_err)?;
        
        Ok(PdfiumWasmRenderer {
            pdfium,
            max_width,
            max_height,
            bitmap: Rc::new(RefCell::new(bitmap))
        })
    }

    pub fn load_document(&self, bytes: &[u8]) -> Result<PdfiumWasmDocument> {
        let doc = self
            .pdfium
            .load_pdf_from_bytes(bytes, None)
            .map_err(js_err)?;
        PdfiumWasmDocument::new(doc, self.bitmap.clone())
    }
}

#[wasm_bindgen]
pub struct PdfiumWasmDocument {
    doc: PdfDocument<'static>,
    bitmap: Rc<RefCell<PdfBitmap<'static>>>
}

#[wasm_bindgen]
impl PdfiumWasmDocument {
    fn new(doc: PdfDocument<'static>, bitmap: Rc<RefCell<PdfBitmap<'static>>>) -> Result<PdfiumWasmDocument> {
        Ok(PdfiumWasmDocument { doc, bitmap })
    }

    pub fn pages(&self) -> u16 {
        self.doc.pages().len()
    }

    pub fn page_size(&self, n: u16) -> Result<PdfiumWasmPageSize> {
        let page = self.doc.pages().get(n).map_err(js_err)?;
        Ok(PdfiumWasmPageSize {
            width: page.width().value,
            height: page.height().value,
        })
    }

    pub fn render_page(&self, n: u16, width_px: u16, callback: Function) -> Result {
        let page = self.doc.pages().get(n).map_err(js_err)?;
        let cfg = PdfRenderConfig::new().set_target_width(width_px);
        
        let bitmap_ref: &mut PdfBitmap<'static> = &mut *self.bitmap.borrow_mut();
       page.render_into_bitmap_with_config(bitmap_ref, &cfg).map_err(js_err)?;
     
        let array: Uint8Array = bitmap_ref.as_array();
        let bytes = Uint8ClampedArray::new_with_byte_offset_and_length(
            &array.buffer(),
            array.byte_offset(),
            array.byte_length(),
        );
        callback.call3(
            &JsValue::null(),
            &bytes,
            &bitmap_ref.width().into(),
            &bitmap_ref.height().into(),
        )?;
        Ok(())
    }
}

#[wasm_bindgen]
pub struct PdfiumWasmPageSize {
    pub width: f32,
    pub height: f32,
}

fn js_err(err: PdfiumError) -> JsValue {
    format!("{:?}", err).into()
}

fn log(s: impl Into<String>) {
    web_sys::console::log_1(&s.into().into());
}
