Vektor Flow browser compiler preview

This compiler is incomplete. The hosted editable examples define the verified
preview scope. Full language and physics integration remain in progress.

compiler.mjs is the Emscripten ES module factory, compiler.wasm is the compiler
module, and compiler.data contains its matching standard library. Keep these
three files together and serve them over HTTP(S). Compilation is performed
locally in WebAssembly. The website supplies the program execution, output,
rendering and concurrent-worker host.

Third-party notices are included in third-party/. They apply to those components
and do not grant a new license to the Vektor Flow compiler.
