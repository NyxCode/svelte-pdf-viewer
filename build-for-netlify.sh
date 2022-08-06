#!/bin/sh
set -e

cd ./pdfium
wasm-pack build --target web --release
cd ../viewer
npm i
npm run build