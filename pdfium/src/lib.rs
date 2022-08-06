use js_sys::{Function, Uint8ClampedArray};
use pdfium_render::error::PdfiumError;
use pdfium_render::page::PdfPage;
use pdfium_render::pdfium::Pdfium;
use pdfium_render::prelude::PdfDocument;
use pdfium_render::render_config::PdfRenderConfig;
use wasm_bindgen::JsValue;
use web_sys::Blob;
use wasm_bindgen::prelude::wasm_bindgen;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub type Result<T = ()> = std::result::Result<T, JsValue>;

#[wasm_bindgen]
pub struct Renderer {
    pdfium: &'static Pdfium,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Renderer> {
        let bindings = Pdfium::bind_to_system_library().map_err(js_err)?;
        let pdfium = Pdfium::new(bindings);
        Ok(Renderer {
            pdfium: Box::leak(Box::new(pdfium)),
        })
    }
    
    pub fn load_document(&self, bytes: &[u8]) -> Result<Document> {
        let doc = self.pdfium.load_pdf_from_bytes(bytes, None).map_err(js_err)?;
        Document::new(doc)
    }
}

#[wasm_bindgen]
pub struct Document {
    doc: PdfDocument<'static>
}

#[wasm_bindgen]
impl Document {
    fn new(doc: PdfDocument<'static>) -> Result<Document> {
        Ok(Document {
            doc
        })
    }

    pub fn page_size(&self, n: u16) -> Result<PageSize> {
        let page = self.doc.pages().get(n).map_err(js_err)?;
        Ok(PageSize {
            width: page.width().value,
            height: page.height().value
        })
    }
    
    pub fn render_page(&self, n: u16, width_px: u16, callback: Function) -> Result {
        let page = self.doc.pages().get(n).map_err(js_err)?;
        let cfg = PdfRenderConfig::new().set_target_width(width_px);
        let mut bitmap = page.render_with_config(&cfg).map_err(js_err)?;
        let bytes = Uint8ClampedArray::new(&bitmap.as_array().buffer());
        callback.call3(&JsValue::null(), &bytes, &bitmap.width().into(), &bitmap.height().into())?;
        Ok(())
    }
}

#[wasm_bindgen]
pub struct PageSize {
    pub width: f32,
    pub height: f32
}


fn js_err(err: PdfiumError) -> JsValue {
    format!("{:?}", err).into()
}
