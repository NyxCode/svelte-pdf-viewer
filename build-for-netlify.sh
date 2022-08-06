#!/bin/sh
set -e

cargo install wasm-pack

cd ./pdfium
wasm-pack build --target web --release
cd ../viewer
npm i
npm run build