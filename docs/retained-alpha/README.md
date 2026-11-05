# Native translucent alpha and capture qualification

The WebGL simplex backend already uses a premultiplied-alpha canvas and straight shader RGBA. Its old blendFunc(SRC_ALPHA,ONE_MINUS_SRC_ALPHA) multiplied the ALPHA channel by alpha too: a faint native grid-colored face wrote raw[15,16,16,1]. That violates PMA, produces a clamped2D copy[255,255,255,1], and disagrees with the visible screen contract.

The minimal fix uses blendFuncSeparate(SRC_ALPHA,ONE_MINUS_SRC_ALPHA,ONE,ONE_MINUS_SRC_ALPHA). Geometry, color RGB blend factors, shaders, dirty uploads and WebGPU remain unchanged. Corrected raw[15,16,16,16] is valid PMA; source2D copy[239,255,255,16] composes over black as[15,16,16], identical to browser screenshot. Retained opaque prefix/partial/no-op/resize preservation still passes.

Actual browser regression uses the existing native simplex renderer, manual compositor, explicit VideoFrame and frame movie capture. Native default VP9 yields decoded[14,16,16] versus screenshot/composite[15,16,16]. Run node tests/retained-alpha/browser.cjs. No invented grid or host rendering replacement is used in the product.

A SECOND observed limitation exists in this software Chrome VP8 path: full-range encoded luma16 at the faint face, black0/white255, and container stream pc/bt709 metadata, but decoded FRAME metadata tv/bt470bg. Default FFmpeg conversion clips the faint face toblack. Explicit diagnostic full-range conversion recovers[14,16,16]; this diagnoses range signaling, not quantization, and is not a production workaround. The existing native default VP9 is the qualified profile. CODEC=vp8 runs the explicit RED regression. No codec implementation or frame movie helper was changed. The claim is scoped to this measured path, not every VP8 implementation.
