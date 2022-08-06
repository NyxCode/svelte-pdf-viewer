import * as wasm from './pdfium_bg.wasm';

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedFloat64Memory0 = new Float64Array();

function getFloat64Memory0() {
    if (cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1);
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
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
export function initialize_pdfium_render(pdfium_wasm_module, local_wasm_module, debug) {
    const ret = wasm.initialize_pdfium_render(addHeapObject(pdfium_wasm_module), addHeapObject(local_wasm_module), debug);
    return ret !== 0;
}

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
export function read_block_from_callback_wasm(param, position, pBuf, size) {
    const ret = wasm.read_block_from_callback_wasm(param, position, pBuf, size);
    return ret;
}

/**
* A callback function that can be invoked by Pdfium's `FPDF_SaveAsCopy()` and `FPDF_SaveWithVersion()`
* functions, wrapping around `crate::utils::files::write_block_from_callback()` to shuffle data buffers
* from Pdfium's WASM memory heap to our WASM memory heap as they are written.
* @param {number} param
* @param {number} buf
* @param {number} size
* @returns {number}
*/
export function write_block_from_callback_wasm(param, buf, size) {
    const ret = wasm.write_block_from_callback_wasm(param, buf, size);
    return ret;
}

function getCachedStringFromWasm0(ptr, len) {
    if (ptr === 0) {
        return getObject(len);
    } else {
        return getStringFromWasm0(ptr, len);
    }
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
*/
export class Document {

    static __wrap(ptr) {
        const obj = Object.create(Document.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_document_free(ptr);
    }
    /**
    * @param {number} n
    * @returns {PageSize}
    */
    page_size(n) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.document_page_size(retptr, this.ptr, n);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return PageSize.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} n
    * @param {number} width_px
    * @param {Function} callback
    */
    render_page(n, width_px, callback) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.document_render_page(retptr, this.ptr, n, width_px, addHeapObject(callback));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
*/
export class PageSize {

    static __wrap(ptr) {
        const obj = Object.create(PageSize.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pagesize_free(ptr);
    }
    /**
    * @returns {number}
    */
    get width() {
        const ret = wasm.__wbg_get_pagesize_width(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set width(arg0) {
        wasm.__wbg_set_pagesize_width(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get height() {
        const ret = wasm.__wbg_get_pagesize_height(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set height(arg0) {
        wasm.__wbg_set_pagesize_height(this.ptr, arg0);
    }
}
/**
*/
export class Renderer {

    static __wrap(ptr) {
        const obj = Object.create(Renderer.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_renderer_free(ptr);
    }
    /**
    */
    constructor() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.renderer_new(retptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Renderer.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Uint8Array} bytes
    * @returns {Document}
    */
    load_document(bytes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.renderer_load_document(retptr, this.ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Document.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbg_new_693216e109162396() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_0ddaca5d1abfb52f(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_error_09919627ac0992f5(arg0, arg1) {
    var v0 = getCachedStringFromWasm0(arg0, arg1);
if (arg0 !== 0) { wasm.__wbindgen_free(arg0, arg1); }
console.error(v0);
};

export function __wbg_newwithlabel_32e9fd5382f2da39() { return handleError(function (arg0, arg1) {
    var v0 = getCachedStringFromWasm0(arg0, arg1);
    const ret = new TextDecoder(v0);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_decode_f72f1759c317c492() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg1).decode(getArrayU8FromWasm0(arg2, arg3));
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}, arguments) };

export function __wbg_debug_8d5c9682707743f7(arg0) {
    console.debug(getObject(arg0));
};

export function __wbg_error_800b8d466653f7ea(arg0) {
    console.error(getObject(arg0));
};

export function __wbg_info_f740d3f66bf6659c(arg0) {
    console.info(getObject(arg0));
};

export function __wbg_log_17733ab6fa45831d(arg0) {
    console.log(getObject(arg0));
};

export function __wbg_warn_ee027638ccb24e00(arg0) {
    console.warn(getObject(arg0));
};

export function __wbg_instanceof_Window_42f092928baaee84(arg0) {
    const ret = getObject(arg0) instanceof Window;
    return ret;
};

export function __wbg_get_ad41fee29b7e0f53(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
};

export function __wbg_length_a73bfd4c96dd97ef(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_new_ee1a3da85465d621() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_971e9a5abe185139(arg0, arg1) {
    var v0 = getCachedStringFromWasm0(arg0, arg1);
    const ret = new Function(v0);
    return addHeapObject(ret);
};

export function __wbg_get_72332cd2bc57924c() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_33d7bcddbbfa394a() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_self_fd00a1ef86d1b2ed() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_6f6e346d8bbd61d7() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_3348936ac49df00a() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_67175caf56f55ca9() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_newwithlength_df0e16f0b90b6295(arg0) {
    const ret = new Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_set_64cc39858b2ec3f1(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_from_94cd4a66487bd7a5(arg0) {
    const ret = Array.from(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_isArray_a1a8c3a8ac24bdf1(arg0) {
    const ret = Array.isArray(getObject(arg0));
    return ret;
};

export function __wbg_of_b13a2b9ef428a2e3(arg0) {
    const ret = Array.of(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_of_85777d7b997ff4db(arg0, arg1) {
    const ret = Array.of(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_of_d7bdfaa8e1a4806f(arg0, arg1, arg2) {
    const ret = Array.of(getObject(arg0), getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_of_547f094e65266406(arg0, arg1, arg2, arg3) {
    const ret = Array.of(getObject(arg0), getObject(arg1), getObject(arg2), getObject(arg3));
    return addHeapObject(ret);
};

export function __wbg_of_24d92441224719d8(arg0, arg1, arg2, arg3, arg4) {
    const ret = Array.of(getObject(arg0), getObject(arg1), getObject(arg2), getObject(arg3), getObject(arg4));
    return addHeapObject(ret);
};

export function __wbg_push_0bc7fce4a139a883(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
};

export function __wbg_apply_769e865e14ecdbb0() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).apply(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_65af9f665ab6ade5() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_a51357fb7467f969() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2), getObject(arg3), getObject(arg4));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_length_8ddcef844d3ae61b(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_buffer_34f5ec9f8a838ba0(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_88fdad741db1b182(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_cda198d9dbc6d7ea(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_1a930cfcda1a8067(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_51f19f73d6d9eff3(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_new_7091a04c151f45d8(arg0) {
    const ret = new Uint8ClampedArray(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_buffer_82a7641831277fcf(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_subarray_270ff8dd5582c1ac(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_slice_c5c043218effc26f(arg0, arg1, arg2) {
    const ret = getObject(arg0).slice(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getindex_55403117a495546e(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return ret;
};

export function __wbg_length_c2a0a2ded1ea7983(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_get_4987f87cbcb53a7b() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).get(arg1 >>> 0);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_4eb79128c6acd764() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).set(arg1 >>> 0, getObject(arg2));
}, arguments) };

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

