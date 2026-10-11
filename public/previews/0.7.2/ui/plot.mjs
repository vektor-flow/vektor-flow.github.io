//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
//#region ../../../Tesseracs/products.platonic-play.web/node_modules/vektor-flow/web/vf-ui/geom/vf-gpu-backend-probe.mjs
function createWebGpuProbeCanvas(canvas) {
	if (typeof globalThis.OffscreenCanvas === "function") return new globalThis.OffscreenCanvas(1, 1);
	const document = canvas?.ownerDocument || globalThis.document;
	if (typeof document?.createElement === "function") return document.createElement("canvas");
	return typeof canvas?.cloneNode === "function" ? canvas.cloneNode(false) : null;
}
//#endregion
//#region ../../../Tesseracs/products.platonic-play.web/node_modules/vektor-flow/web/vf-ui/geom/vf-screen-simplex-renderer.mjs
var FLOATS_PER_VERTEX = 6;
var BYTES_PER_VERTEX = FLOATS_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;
var DEFAULT_COLOR = Object.freeze([
	1,
	1,
	1,
	1
]);
function growPackedVertexCapacity(currentBytes, requiredBytes) {
	let capacity = Math.max(0, Number(currentBytes) || 0);
	const required = Math.max(0, Number(requiredBytes) || 0);
	if (required <= capacity) return capacity;
	capacity = Math.max(256, capacity);
	while (capacity < required) capacity *= 2;
	return Math.ceil(capacity / 4) * 4;
}
function colorToRgba(color) {
	if (Array.isArray(color) || ArrayBuffer.isView(color)) return [
		clampUnit(Number(color[0])),
		clampUnit(Number(color[1])),
		clampUnit(Number(color[2])),
		clampUnit(color[3] == null ? 1 : Number(color[3]))
	];
	const value = String(color || "").trim().toLowerCase();
	if (value === "transparent") return [
		0,
		0,
		0,
		0
	];
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value);
	if (hex) {
		let digits = hex[1];
		if (digits.length === 3) digits = digits.split("").map((digit) => `${digit}${digit}`).join("");
		const alpha = digits.length === 8 ? Number.parseInt(digits.slice(6, 8), 16) / 255 : 1;
		return [
			Number.parseInt(digits.slice(0, 2), 16) / 255,
			Number.parseInt(digits.slice(2, 4), 16) / 255,
			Number.parseInt(digits.slice(4, 6), 16) / 255,
			alpha
		];
	}
	const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(value);
	if (rgba) return [
		clampUnit(Number(rgba[1]) / 255),
		clampUnit(Number(rgba[2]) / 255),
		clampUnit(Number(rgba[3]) / 255),
		clampUnit(rgba[4] == null ? 1 : Number(rgba[4]))
	];
	return [...DEFAULT_COLOR];
}
function buildScreenSpaceSimplexVertices(scene = {}) {
	const packed = [];
	for (const primitive of Array.isArray(scene.primitives) ? scene.primitives : []) {
		if (primitive?.kind === "face") appendFace(packed, primitive);
		if (primitive?.kind === "edge") appendEdge(packed, primitive);
		if (primitive?.kind === "vertex") appendVertex(packed, primitive);
	}
	return new Float32Array(packed);
}
function createRetainedScreenSpaceSimplexScene() {
	const records = /* @__PURE__ */ new Map();
	let packed = /* @__PURE__ */ new Float32Array();
	let dirty = false;
	let invalidated = false;
	function upsert(id, primitive) {
		const key = String(id);
		const current = records.get(key);
		if (current?.primitive === primitive) return false;
		const nextPacked = buildScreenSpaceSimplexVertices({ primitives: [primitive] });
		if (current && equalPackedVertices(current.packed, nextPacked)) {
			records.set(key, {
				primitive,
				packed: current.packed
			});
			return false;
		}
		records.set(key, {
			primitive,
			packed: nextPacked
		});
		dirty = true;
		return true;
	}
	function remove(id) {
		const changed = records.delete(String(id));
		dirty ||= changed;
		return changed;
	}
	function replace(nextRecords = []) {
		const next = /* @__PURE__ */ new Map();
		for (const [id, primitive] of nextRecords) {
			const key = String(id);
			const current = records.get(key);
			if (current?.primitive === primitive) {
				next.set(key, current);
				continue;
			}
			const nextPacked = buildScreenSpaceSimplexVertices({ primitives: [primitive] });
			if (current && equalPackedVertices(current.packed, nextPacked)) {
				next.set(key, {
					primitive,
					packed: current.packed
				});
				continue;
			}
			next.set(key, {
				primitive,
				packed: nextPacked
			});
			dirty = true;
		}
		const previousKeys = [...records.keys()];
		const nextKeys = [...next.keys()];
		if (previousKeys.length !== nextKeys.length || previousKeys.some((key, index) => key !== nextKeys[index])) dirty = true;
		records.clear();
		for (const [key, record] of next) records.set(key, record);
		return dirty;
	}
	function commit(renderer) {
		if (!dirty) return false;
		const previous = packed;
		const length = [...records.values()].reduce((sum, record) => sum + record.packed.length, 0);
		packed = new Float32Array(length);
		let offset = 0;
		for (const record of records.values()) {
			packed.set(record.packed, offset);
			offset += record.packed.length;
		}
		renderer.setPackedVertices(packed, invalidated ? Object.freeze({
			floatOffset: 0,
			floatLength: packed.length
		}) : packedVertexDirtyRange(previous, packed));
		dirty = false;
		invalidated = false;
		return true;
	}
	function invalidate() {
		dirty = true;
		invalidated = true;
	}
	return Object.freeze({
		upsert,
		remove,
		replace,
		commit,
		invalidate,
		get size() {
			return records.size;
		},
		get packedVertices() {
			return packed;
		}
	});
}
function packedVertexDirtyRange(previous, next) {
	if (previous.length !== next.length) return Object.freeze({
		floatOffset: 0,
		floatLength: next.length
	});
	let start = 0;
	while (start < next.length && previous[start] === next[start]) start += 1;
	let end = next.length;
	while (end > start && previous[end - 1] === next[end - 1]) end -= 1;
	return Object.freeze({
		floatOffset: start,
		floatLength: end - start
	});
}
function equalPackedVertices(left, right) {
	if (left.length !== right.length) return false;
	for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false;
	return true;
}
function requirePackedSimplexVertices(value) {
	if (!(value instanceof Float32Array)) throw new TypeError("packed simplex vertices must be a Float32Array");
	if (value.length % (FLOATS_PER_VERTEX * 3) !== 0) throw new RangeError("packed simplex vertices must contain complete triangles");
	return value;
}
function createScreenSpaceSimplexRenderer(canvas, options = {}) {
	if (!canvas?.getContext) throw new TypeError("canvas must provide getContext");
	const pixelRatio = options.pixelRatio || (() => globalThis.devicePixelRatio || 1);
	let backend = null;
	let scene = { primitives: [] };
	let vertices = /* @__PURE__ */ new Float32Array();
	let cssWidth = 1;
	let cssHeight = 1;
	let destroyed = false;
	async function initialize() {
		assertAlive();
		resize();
		backend = await createWebGpuBackend(canvas).catch(() => null);
		if (!backend) backend = createWebGl2Backend(canvas);
		if (!backend) throw new Error("A WebGPU or WebGL2 GPU backend is required");
		backend.resize(cssWidth, cssHeight);
		backend.render(vertices);
		return backend.kind;
	}
	function setScene(nextScene = {}) {
		assertAlive();
		scene = nextScene;
		vertices = buildScreenSpaceSimplexVertices(scene);
		backend?.render(vertices);
	}
	function setPackedVertices(nextVertices, dirtyRange = null) {
		assertAlive();
		scene = null;
		vertices = requirePackedSimplexVertices(nextVertices);
		backend?.render(vertices, dirtyRange);
	}
	function resize(width = canvas.clientWidth, height = canvas.clientHeight) {
		assertAlive();
		cssWidth = Math.max(1, Number(width) || 1);
		cssHeight = Math.max(1, Number(height) || 1);
		const ratio = Math.max(1, Number(pixelRatio()) || 1);
		const bufferWidth = Math.max(1, Math.round(cssWidth * ratio));
		const bufferHeight = Math.max(1, Math.round(cssHeight * ratio));
		if (canvas.width !== bufferWidth) canvas.width = bufferWidth;
		if (canvas.height !== bufferHeight) canvas.height = bufferHeight;
		backend?.resize(cssWidth, cssHeight);
		backend?.render(vertices);
	}
	function destroy() {
		if (destroyed) return;
		destroyed = true;
		backend?.destroy();
		backend = null;
		vertices = /* @__PURE__ */ new Float32Array();
		scene = { primitives: [] };
	}
	function assertAlive() {
		if (destroyed) throw new Error("screen-space simplex renderer is destroyed");
	}
	return Object.freeze({
		initialize,
		setScene,
		setPackedVertices,
		resize,
		destroy,
		get backend() {
			return backend?.kind || null;
		}
	});
}
function appendFace(output, primitive) {
	const points = validPoints(primitive.points);
	if (points.length < 3) return;
	const colors = pointColors(primitive.colors, points.length, primitive.color);
	for (let index = 1; index < points.length - 1; index += 1) {
		appendPackedVertex(output, points[0], colors[0]);
		appendPackedVertex(output, points[index], colors[index]);
		appendPackedVertex(output, points[index + 1], colors[index + 1]);
	}
}
function appendEdge(output, primitive) {
	const from = validPoint(primitive.from);
	const to = validPoint(primitive.to);
	const width = Math.max(0, Number(primitive.width) || 0);
	if (!from || !to || width <= 0) return;
	const dx = to[0] - from[0];
	const dy = to[1] - from[1];
	const length = Math.hypot(dx, dy);
	if (length <= 1e-9) return;
	const nx = -dy / length * width / 2;
	const ny = dx / length * width / 2;
	const a = [from[0] + nx, from[1] + ny];
	const b = [from[0] - nx, from[1] - ny];
	const c = [to[0] - nx, to[1] - ny];
	const d = [to[0] + nx, to[1] + ny];
	const fromColor = colorToRgba(primitive.fromColor ?? primitive.color);
	const toColor = colorToRgba(primitive.toColor ?? primitive.color);
	for (const [point, color] of [
		[a, fromColor],
		[b, fromColor],
		[c, toColor],
		[a, fromColor],
		[c, toColor],
		[d, toColor]
	]) appendPackedVertex(output, point, color);
}
function pointColors(colors, count, fallback) {
	if (!Array.isArray(colors) || colors.length !== count) {
		const color = colorToRgba(fallback);
		return Array.from({ length: count }, () => color);
	}
	return colors.map(colorToRgba);
}
function appendVertex(output, primitive) {
	const center = validPoint(primitive.center);
	const radius = Math.max(0, Number(primitive.radius) || 0);
	if (!center || radius <= 0) return;
	const segments = Math.max(6, Math.min(64, Math.round(Number(primitive.segments) || 16)));
	const color = colorToRgba(primitive.color);
	for (let index = 0; index < segments; index += 1) {
		const start = index / segments * Math.PI * 2;
		const end = (index + 1) / segments * Math.PI * 2;
		appendPackedVertex(output, center, color);
		appendPackedVertex(output, [center[0] + Math.cos(start) * radius, center[1] + Math.sin(start) * radius], color);
		appendPackedVertex(output, [center[0] + Math.cos(end) * radius, center[1] + Math.sin(end) * radius], color);
	}
}
function appendPackedVertex(output, point, color) {
	output.push(point[0], point[1], color[0], color[1], color[2], color[3]);
}
function validPoints(points) {
	return Array.isArray(points) ? points.map(validPoint).filter(Boolean) : [];
}
function validPoint(point) {
	if (!Array.isArray(point) || point.length < 2) return null;
	const x = Number(point[0]);
	const y = Number(point[1]);
	return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}
function clampUnit(value) {
	return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
async function createWebGpuBackend(canvas) {
	if (!globalThis.navigator?.gpu) return null;
	if (!createWebGpuProbeCanvas(canvas)?.getContext?.("webgpu")) return null;
	const adapter = await globalThis.navigator.gpu.requestAdapter();
	if (!adapter) return null;
	const device = await adapter.requestDevice();
	const context = canvas.getContext("webgpu");
	if (!context) return null;
	const format = globalThis.navigator.gpu.getPreferredCanvasFormat();
	const shader = device.createShaderModule({ code: `
      struct Viewport {
        size: vec2f,
        padding: vec2f,
      }
      @group(0) @binding(0) var<uniform> viewport: Viewport;

      struct VertexInput {
        @location(0) position: vec2f,
        @location(1) color: vec4f,
      }
      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      }

      @vertex fn vertexMain(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.position = vec4f(
          input.position.x / viewport.size.x * 2.0 - 1.0,
          1.0 - input.position.y / viewport.size.y * 2.0,
          0.0,
          1.0
        );
        output.color = input.color;
        return output;
      }

      @fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
        return input.color;
      }
    ` });
	const viewportBuffer = device.createBuffer({
		size: 16,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
	});
	const bindGroupLayout = device.createBindGroupLayout({ entries: [{
		binding: 0,
		visibility: GPUShaderStage.VERTEX,
		buffer: { type: "uniform" }
	}] });
	const pipeline = device.createRenderPipeline({
		layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
		vertex: {
			module: shader,
			entryPoint: "vertexMain",
			buffers: [{
				arrayStride: BYTES_PER_VERTEX,
				attributes: [{
					shaderLocation: 0,
					offset: 0,
					format: "float32x2"
				}, {
					shaderLocation: 1,
					offset: 8,
					format: "float32x4"
				}]
			}]
		},
		fragment: {
			module: shader,
			entryPoint: "fragmentMain",
			targets: [{
				format,
				blend: {
					color: {
						srcFactor: "src-alpha",
						dstFactor: "one-minus-src-alpha"
					},
					alpha: {
						srcFactor: "one",
						dstFactor: "one-minus-src-alpha"
					}
				}
			}]
		},
		primitive: { topology: "triangle-list" }
	});
	const bindGroup = device.createBindGroup({
		layout: bindGroupLayout,
		entries: [{
			binding: 0,
			resource: { buffer: viewportBuffer }
		}]
	});
	let vertexBuffer = null;
	let vertexCapacity = 0;
	let vertexCount = 0;
	return {
		kind: "webgpu",
		resize(width, height) {
			context.configure({
				device,
				format,
				alphaMode: "premultiplied"
			});
			device.queue.writeBuffer(viewportBuffer, 0, new Float32Array([
				width,
				height,
				0,
				0
			]));
		},
		render(vertices, dirtyRange = null) {
			vertexCount = vertices.length / FLOATS_PER_VERTEX;
			let replacedBuffer = false;
			if (vertices.byteLength > vertexCapacity) {
				vertexBuffer?.destroy();
				vertexCapacity = growPackedVertexCapacity(vertexCapacity, vertices.byteLength);
				vertexBuffer = device.createBuffer({
					size: vertexCapacity,
					usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
				});
				replacedBuffer = true;
			}
			if (vertices.byteLength) if (!replacedBuffer && dirtyRange && dirtyRange.floatLength < vertices.length) {
				if (dirtyRange.floatLength > 0) device.queue.writeBuffer(vertexBuffer, dirtyRange.floatOffset * Float32Array.BYTES_PER_ELEMENT, vertices, dirtyRange.floatOffset, dirtyRange.floatLength);
			} else device.queue.writeBuffer(vertexBuffer, 0, vertices);
			const encoder = device.createCommandEncoder();
			const pass = encoder.beginRenderPass({ colorAttachments: [{
				view: context.getCurrentTexture().createView(),
				clearValue: {
					r: 0,
					g: 0,
					b: 0,
					a: 0
				},
				loadOp: "clear",
				storeOp: "store"
			}] });
			if (vertexBuffer && vertexCount) {
				pass.setPipeline(pipeline);
				pass.setBindGroup(0, bindGroup);
				pass.setVertexBuffer(0, vertexBuffer);
				pass.draw(vertexCount);
			}
			pass.end();
			device.queue.submit([encoder.finish()]);
		},
		destroy() {
			vertexBuffer?.destroy();
			viewportBuffer.destroy();
			device.destroy();
		}
	};
}
function createWebGl2Backend(canvas) {
	const gl = canvas.getContext("webgl2", {
		alpha: true,
		antialias: true,
		premultipliedAlpha: true
	});
	if (!gl) return null;
	const program = createWebGlProgram(gl, `#version 300 es
    in vec2 a_position;
    in vec4 a_color;
    uniform vec2 u_viewport;
    out vec4 v_color;
    void main() {
      gl_Position = vec4(
        a_position.x / u_viewport.x * 2.0 - 1.0,
        1.0 - a_position.y / u_viewport.y * 2.0,
        0.0,
        1.0
      );
      v_color = a_color;
    }
  `, `#version 300 es
    precision mediump float;
    in vec4 v_color;
    out vec4 out_color;
    void main() {
      out_color = v_color;
    }
  `);
	const buffer = gl.createBuffer();
	const positionLocation = gl.getAttribLocation(program, "a_position");
	const colorLocation = gl.getAttribLocation(program, "a_color");
	const viewportLocation = gl.getUniformLocation(program, "u_viewport");
	let cssSize = [1, 1];
	let bufferCapacity = 0;
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	return {
		kind: "webgl2",
		resize(width, height) {
			cssSize = [width, height];
			gl.viewport(0, 0, canvas.width, canvas.height);
		},
		render(vertices, dirtyRange = null) {
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			if (!vertices.length) return;
			gl.useProgram(program);
			gl.uniform2f(viewportLocation, cssSize[0], cssSize[1]);
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			const replacedBuffer = vertices.byteLength > bufferCapacity;
			if (replacedBuffer) {
				bufferCapacity = growPackedVertexCapacity(bufferCapacity, vertices.byteLength);
				gl.bufferData(gl.ARRAY_BUFFER, bufferCapacity, gl.DYNAMIC_DRAW);
			}
			if (!replacedBuffer && dirtyRange && dirtyRange.floatLength < vertices.length) {
				if (dirtyRange.floatLength > 0) gl.bufferSubData(gl.ARRAY_BUFFER, dirtyRange.floatOffset * Float32Array.BYTES_PER_ELEMENT, vertices, dirtyRange.floatOffset, dirtyRange.floatLength);
			} else gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
			gl.enableVertexAttribArray(positionLocation);
			gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, BYTES_PER_VERTEX, 0);
			gl.enableVertexAttribArray(colorLocation);
			gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, BYTES_PER_VERTEX, 8);
			gl.drawArrays(gl.TRIANGLES, 0, vertices.length / FLOATS_PER_VERTEX);
		},
		destroy() {
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
		}
	};
}
function createWebGlProgram(gl, vertexSource, fragmentSource) {
	const compile = (type, source) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const message = gl.getShaderInfoLog(shader) || "WebGL shader compilation failed";
			gl.deleteShader(shader);
			throw new Error(message);
		}
		return shader;
	};
	const vertex = compile(gl.VERTEX_SHADER, vertexSource);
	const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram();
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const message = gl.getProgramInfoLog(program) || "WebGL program linking failed";
		gl.deleteProgram(program);
		throw new Error(message);
	}
	return program;
}
//#endregion
//#region ../../../Tesseracs/products.platonic-play.web/node_modules/vektor-flow/web/vf-ui/vf-layered-screen-scene.mjs
var SCREEN_SCENE_LAYER = Object.freeze({
	FACE: 0,
	EDGE: 1,
	VERTEX: 2,
	OVERLAY: 3,
	SELECTION: 4
});
function createLayeredScreenScene({ retained = createRetainedScreenSpaceSimplexScene() } = {}) {
	let records = [];
	return Object.freeze({
		beginFrame() {
			records = [];
		},
		primitive(scope, id, primitive, { selection = false, overlay = false } = {}) {
			const layer = selection ? SCREEN_SCENE_LAYER.SELECTION : overlay ? SCREEN_SCENE_LAYER.OVERLAY : primitiveLayer(primitive);
			records.push(Object.freeze({
				id: `${scope}:${selection ? "selection:" : ""}${id}`,
				primitive,
				layer,
				order: records.length
			}));
		},
		commit(renderer) {
			retained.replace(records.sort((left, right) => left.layer - right.layer || left.order - right.order).map(({ id, primitive }) => [id, primitive]));
			return renderer ? retained.commit(renderer) : false;
		},
		invalidate() {
			retained.invalidate();
		},
		snapshot() {
			return Object.freeze(records.map(({ id, primitive, layer }) => Object.freeze({
				id,
				primitive,
				layer
			})));
		}
	});
}
function primitiveLayer(primitive) {
	if (primitive?.kind === "face") return SCREEN_SCENE_LAYER.FACE;
	if (primitive?.kind === "vertex") return SCREEN_SCENE_LAYER.VERTEX;
	return SCREEN_SCENE_LAYER.EDGE;
}
//#endregion
//#region browser-ui/vf-retained-geometry-scene.mjs
function createRetainedGeometryScene() {
	const scene = createLayeredScreenScene();
	function beginFrame() {
		scene.beginFrame();
	}
	function primitive(scope, id, value, { selection = false, overlay = false } = {}) {
		scene.primitive(scope, id, value, {
			selection,
			overlay
		});
	}
	function path(scope, id, points, width, stops, options = {}) {
		if (!Array.isArray(points) || points.length < 2) return;
		const lengths = [0];
		for (let index = 1; index < points.length; index += 1) lengths.push(lengths.at(-1) + Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]));
		const total = lengths.at(-1) || 1;
		const offsets = uniqueSortedOffsets([...lengths.map((length) => length / total), ...Array.isArray(stops) ? stops.map(({ offset }) => offset) : []]);
		for (let index = 1; index < offsets.length; index += 1) {
			const fromOffset = offsets[index - 1];
			const toOffset = offsets[index];
			const fromColor = rgbaAtStops(stops, fromOffset);
			const toColor = rgbaAtStops(stops, toOffset);
			primitive(scope, `${id}:${index - 1}`, {
				kind: "edge",
				from: pointAtPathOffset(points, lengths, total, fromOffset),
				to: pointAtPathOffset(points, lengths, total, toOffset),
				width,
				fromColor,
				toColor
			}, options);
		}
	}
	function sphereImpostor(scope, id, center, radius, color, options = {}) {
		const rgba = colorToRgba(color);
		primitive(scope, `${id}:rim`, {
			kind: "vertex",
			center,
			radius,
			segments: 32,
			color: shadeRgba(rgba, -.48)
		}, options);
		primitive(scope, `${id}:body`, {
			kind: "vertex",
			center: [center[0] - radius * .08, center[1] - radius * .08],
			radius: radius * .78,
			segments: 32,
			color: rgba
		}, options);
		primitive(scope, `${id}:light`, {
			kind: "vertex",
			center: [center[0] - radius * .3, center[1] - radius * .3],
			radius: radius * .24,
			segments: 20,
			color: shadeRgba(rgba, .52)
		}, options);
	}
	function tubeImpostor(scope, id, points, width, stops, options = {}) {
		path(scope, `${id}:shadow`, points, width, shadeStops(stops, -.42), options);
		path(scope, `${id}:light`, points, width * .58, shadeStops(stops, .28), options);
	}
	function ring(scope, id, center, radius, width, color, options = {}) {
		const segments = 32;
		path(scope, id, Array.from({ length: 33 }, (_, index) => {
			const angle = index / segments * Math.PI * 2;
			return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
		}), width, solidStops(color), options);
	}
	function arrow(scope, id, arrowValue, color, pixelRatio, options = {}) {
		const [ux, uy] = arrowValue.tangent;
		const length = 8 * pixelRatio;
		const halfWidth = 4.5 * pixelRatio;
		const [x, y] = arrowValue.position;
		primitive(scope, `${id}:head`, {
			kind: "face",
			points: [
				[x, y],
				[x - ux * length - uy * halfWidth, y - uy * length + ux * halfWidth],
				[x - ux * length + uy * halfWidth, y - uy * length - ux * halfWidth]
			],
			color
		}, options);
	}
	function selectionContour(scope, id, points, color, pixelRatio, metrics) {
		if (!Array.isArray(points) || points.length < 2) return;
		const offset = metrics.selectionRadius * pixelRatio;
		const width = metrics.ringWidth * pixelRatio;
		const first = points[0];
		const last = points.at(-1);
		const closed = Math.hypot(last[0] - first[0], last[1] - first[1]) <= 1e-9;
		const outwardSide = closed ? -(Math.sign(closedPathSignedArea(points)) || 1) : null;
		const contourSides = closed ? [outwardSide] : [-1, 1];
		for (let index = 1; index < points.length; index += 1) {
			const from = points[index - 1];
			const to = points[index];
			const dx = to[0] - from[0];
			const dy = to[1] - from[1];
			const length = Math.hypot(dx, dy);
			if (length <= 1e-9) continue;
			const normal = [-dy / length * offset, dx / length * offset];
			for (const side of contourSides) primitive(scope, `${id}:${index - 1}:${side}`, {
				kind: "edge",
				from: [from[0] + normal[0] * side, from[1] + normal[1] * side],
				to: [to[0] + normal[0] * side, to[1] + normal[1] * side],
				width,
				color
			}, { selection: true });
		}
		if (closed) {
			const vertexCount = points.length - 1;
			for (let index = 0; index < vertexCount; index += 1) addSelectionRoundJoin(scope, `${id}:join:${index}`, points[index], points[(index - 1 + vertexCount) % vertexCount], points[(index + 1) % vertexCount], offset, width, color, [outwardSide]);
			return;
		}
		for (let index = 1; index < points.length - 1; index += 1) addSelectionRoundJoin(scope, `${id}:join:${index}`, points[index], points[index - 1], points[index + 1], offset, width, color);
		addSelectionEndCap(scope, `${id}:start-cap`, first, points[1], -1, offset, width, color);
		addSelectionEndCap(scope, `${id}:end-cap`, last, points.at(-2), -1, offset, width, color);
	}
	function addSelectionRoundJoin(scope, id, center, previous, next, radius, width, color, sides = [-1, 1]) {
		const incoming = unitVector$1(center[0] - previous[0], center[1] - previous[1]);
		const outgoing = unitVector$1(next[0] - center[0], next[1] - center[1]);
		if (!incoming || !outgoing) return;
		for (const side of sides) {
			const startAngle = Math.atan2(incoming[0] * side, -incoming[1] * side);
			const delta = shortestAngleDelta(startAngle, Math.atan2(outgoing[0] * side, -outgoing[1] * side));
			if (Math.abs(delta) <= 1e-9) continue;
			const segments = Math.max(2, Math.ceil(Math.abs(delta) / (Math.PI / 12)));
			let previousPoint = [center[0] + Math.cos(startAngle) * radius, center[1] + Math.sin(startAngle) * radius];
			for (let index = 1; index <= segments; index += 1) {
				const angle = startAngle + delta * index / segments;
				const currentPoint = [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
				primitive(scope, `${id}:${side}:${index - 1}`, {
					kind: "edge",
					from: previousPoint,
					to: currentPoint,
					width,
					color
				}, { selection: true });
				previousPoint = currentPoint;
			}
		}
	}
	function addSelectionEndCap(scope, id, center, inside, outwardSign, radius, width, color) {
		const inwardX = inside[0] - center[0];
		const inwardY = inside[1] - center[1];
		const length = Math.hypot(inwardX, inwardY);
		if (length <= 1e-9) return;
		const outward = [inwardX / length * outwardSign, inwardY / length * outwardSign];
		const normal = [-outward[1], outward[0]];
		const segments = 12;
		let previous = [center[0] + normal[0] * radius, center[1] + normal[1] * radius];
		for (let index = 1; index <= segments; index += 1) {
			const angle = index / segments * Math.PI;
			const current = [center[0] + (normal[0] * Math.cos(angle) + outward[0] * Math.sin(angle)) * radius, center[1] + (normal[1] * Math.cos(angle) + outward[1] * Math.sin(angle)) * radius];
			primitive(scope, `${id}:${index - 1}`, {
				kind: "edge",
				from: previous,
				to: current,
				width,
				color
			}, { selection: true });
			previous = current;
		}
	}
	function commit(renderer) {
		return scene.commit(renderer);
	}
	function invalidate() {
		scene.invalidate();
	}
	return Object.freeze({
		beginFrame,
		primitive,
		path,
		sphereImpostor,
		tubeImpostor,
		ring,
		arrow,
		selectionContour,
		commit,
		invalidate
	});
}
function shadeRgba(color, amount) {
	const toward = amount >= 0 ? 1 : 0;
	const strength = Math.min(1, Math.abs(amount));
	return color.map((value, index) => index === 3 ? value : value + (toward - value) * strength);
}
function shadeStops(stops, amount) {
	return stops.map((stop) => ({
		...stop,
		color: shadeRgba(colorToRgba(stop.color), amount)
	}));
}
function rgbaAtStops(stops, offset) {
	const rightIndex = Math.max(1, stops.findIndex((stop) => stop.offset >= offset));
	const left = stops[rightIndex - 1] || stops[0];
	const right = stops[rightIndex] || stops.at(-1);
	const span = right.offset - left.offset;
	const t = span > 1e-12 ? Math.max(0, Math.min(1, (offset - left.offset) / span)) : 0;
	const from = colorToRgba(left.color);
	const to = colorToRgba(right.color);
	return from.map((value, index) => value + (to[index] - value) * t);
}
function solidStops(color) {
	return [{
		offset: 0,
		color
	}, {
		offset: 1,
		color
	}];
}
function uniqueSortedOffsets(offsets) {
	const sorted = offsets.map(Number).filter(Number.isFinite).map((offset) => Math.max(0, Math.min(1, offset))).sort((left, right) => left - right);
	return sorted.filter((offset, index) => index === 0 || offset - sorted[index - 1] > 1e-9);
}
function pointAtPathOffset(points, lengths, total, offset) {
	const target = offset * total;
	let index = 1;
	while (index < lengths.length - 1 && lengths[index] < target) index += 1;
	const fromLength = lengths[index - 1];
	const span = lengths[index] - fromLength;
	if (span <= 1e-12) return [...points[index]];
	const t = Math.max(0, Math.min(1, (target - fromLength) / span));
	return [points[index - 1][0] + (points[index][0] - points[index - 1][0]) * t, points[index - 1][1] + (points[index][1] - points[index - 1][1]) * t];
}
function unitVector$1(x, y) {
	const length = Math.hypot(x, y);
	return length > 1e-9 ? [x / length, y / length] : null;
}
function shortestAngleDelta(from, to) {
	let delta = (to - from) % (Math.PI * 2);
	if (delta > Math.PI) delta -= Math.PI * 2;
	if (delta < -Math.PI) delta += Math.PI * 2;
	return delta;
}
function closedPathSignedArea(points) {
	let area = 0;
	for (let index = 0; index < points.length - 1; index += 1) {
		const from = points[index];
		const to = points[index + 1];
		area += from[0] * to[1] - to[0] * from[1];
	}
	return area / 2;
}
var vkfUiMath = (/* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof module === "object" && module.exports) {
			module.exports = factory();
			return;
		}
		root.VfVkfUiMath = factory();
	})(typeof globalThis !== "undefined" ? globalThis : exports, function() {
		"use strict";
		function cloneVec2(value) {
			return [Number(value && value[0] || 0), Number(value && value[1] || 0)];
		}
		function cloneVec3(value) {
			return [
				Number(value && value[0] || 0),
				Number(value && value[1] || 0),
				Number(value && value[2] || 0)
			];
		}
		function matMul2(a, b) {
			return [
				a[0] * b[0] + a[1] * b[2],
				a[0] * b[1] + a[1] * b[3],
				a[2] * b[0] + a[3] * b[2],
				a[2] * b[1] + a[3] * b[3]
			];
		}
		function matVec2(a, v) {
			return [a[0] * v[0] + a[1] * v[1], a[2] * v[0] + a[3] * v[1]];
		}
		function det2(a) {
			return a[0] * a[3] - a[1] * a[2];
		}
		function invert2(a) {
			var d = det2(a);
			if (Math.abs(d) < 1e-9) return [
				1,
				0,
				0,
				1
			];
			return [
				canonicalZero(a[3] / d),
				canonicalZero(-a[1] / d),
				canonicalZero(-a[2] / d),
				canonicalZero(a[0] / d)
			];
		}
		function canonicalZero(value) {
			return Object.is(value, -0) ? 0 : value;
		}
		function add2(a, b) {
			return [a[0] + b[0], a[1] + b[1]];
		}
		function sub2(a, b) {
			return [a[0] - b[0], a[1] - b[1]];
		}
		function scale2(v, s) {
			return [v[0] * s, v[1] * s];
		}
		function length2(v) {
			return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
		}
		function normalize2(v) {
			var len = length2(v);
			if (len < 1e-9) return [1, 0];
			return [v[0] / len, v[1] / len];
		}
		function pointInPolygon(point, polygon) {
			var inside = false;
			for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
				var xi = polygon[i][0];
				var yi = polygon[i][1];
				var xj = polygon[j][0];
				var yj = polygon[j][1];
				if (yi > point[1] !== yj > point[1] && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi || 1e-9) + xi) inside = !inside;
			}
			return inside;
		}
		function distancePointToSegment(point, a, b) {
			var ab = sub2(b, a);
			var ap = sub2(point, a);
			var denom = ab[0] * ab[0] + ab[1] * ab[1];
			var t = denom > 0 ? (ap[0] * ab[0] + ap[1] * ab[1]) / denom : 0;
			if (t < 0) t = 0;
			if (t > 1) t = 1;
			var closest = [a[0] + ab[0] * t, a[1] + ab[1] * t];
			return {
				distance: length2(sub2(point, closest)),
				closest
			};
		}
		function formatMeasurementNumber(value) {
			var number = Number(value);
			if (!Number.isFinite(number)) return "\\text{--}";
			if (number === 0) return "0";
			var magnitude = Math.abs(number);
			if (magnitude >= 1e4 || magnitude < .001) return number.toExponential(2);
			return String(Number(number.toPrecision(4)));
		}
		function lengthMeasurementLatex(value, squaredValue, unit) {
			var squared = Number(squaredValue);
			var latex = formatMeasurementNumber(value);
			var integer = Math.round(squared);
			if (Number.isFinite(squared) && integer >= 0 && Math.abs(squared - integer) <= 1e-10) {
				var outside = 1;
				var inside = integer;
				for (var factor = Math.floor(Math.sqrt(integer)); factor >= 2; factor -= 1) if (integer % (factor * factor) === 0) {
					outside = factor;
					inside = integer / (factor * factor);
					break;
				}
				if (inside === 1) latex = String(outside);
				else if (inside > 1) latex = (outside === 1 ? "" : String(outside)) + "\\sqrt{" + inside + "}";
			}
			var unitText = String(unit || "").replace(/([{}\\])/g, "\\$1");
			return latex + (unitText ? "\\,\\mathrm{" + unitText + "}" : "");
		}
		function angleMeasurementLatex(radians) {
			return formatMeasurementNumber(Number(radians) * 180 / Math.PI) + "^{\\circ}";
		}
		return {
			cloneVec2,
			cloneVec3,
			matMul2,
			matVec2,
			det2,
			invert2,
			add2,
			sub2,
			scale2,
			length2,
			normalize2,
			pointInPolygon,
			distancePointToSegment,
			lengthMeasurementLatex,
			angleMeasurementLatex
		};
	});
})))(), 1)).default ?? globalThis.VfVkfUiMath;
if (!vkfUiMath) throw new Error("VKF UI math failed to initialize.");
//#endregion
//#region browser-ui/vf-view-transform.mjs
var { add2, matVec2, sub2 } = vkfUiMath;
function normalizeVkfViewTransform(value = {}) {
	const scale = Array.isArray(value.scale) ? [positive$1(value.scale[0], 1), positive$1(value.scale[1], positive$1(value.scale[0], 1))] : [positive$1(value.scale, 1), positive$1(value.scale, 1)];
	return Object.freeze({
		position: Object.freeze(point(value.position)),
		scale: Object.freeze(scale),
		rotation: finite$3(value.rotation, 0)
	});
}
function transformVkfViewPoint(local, value) {
	const transform = normalizeVkfViewTransform(value);
	return add2(transform.position, matVec2(rotationMatrix(transform.rotation), [finite$3(local?.[0], 0) * transform.scale[0], finite$3(local?.[1], 0) * transform.scale[1]]));
}
function inverseTransformVkfViewPoint(world, value) {
	const transform = normalizeVkfViewTransform(value);
	const translated = sub2(point(world), transform.position);
	const unrotated = matVec2(rotationMatrix(-transform.rotation), translated);
	return [unrotated[0] / transform.scale[0], unrotated[1] / transform.scale[1]];
}
function applyVkfViewGesture(value, gesture = {}) {
	const transform = normalizeVkfViewTransform(value);
	const origin = point(gesture.origin);
	const translation = point(gesture.translation);
	const scale = positive$1(gesture.scale, 1);
	const rotation = finite$3(gesture.rotation, 0);
	const relative = sub2(transform.position, origin);
	return normalizeVkfViewTransform({
		position: add2(add2(origin, matVec2(rotationMatrix(rotation), [relative[0] * scale, relative[1] * scale])), translation),
		scale: [transform.scale[0] * scale, transform.scale[1] * scale],
		rotation: transform.rotation + rotation
	});
}
function rotationMatrix(angle) {
	const cosine = Math.cos(angle);
	const sine = Math.sin(angle);
	return [
		cosine,
		-sine,
		sine,
		cosine
	];
}
function point(value) {
	return [finite$3(value?.[0], 0), finite$3(value?.[1], 0)];
}
function finite$3(value, fallback) {
	return Number.isFinite(Number(value)) ? Number(value) : fallback;
}
function positive$1(value, fallback) {
	const number = Number(value);
	return Number.isFinite(number) && number > 0 ? number : fallback;
}
var axis2dTicks = (/* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof module === "object" && module.exports) {
			module.exports = factory();
			return;
		}
		root.VfAxis2DTicks = factory();
	})(typeof globalThis !== "undefined" ? globalThis : exports, function() {
		"use strict";
		function tickDistanceBand(tickDist, minTickDist, maxTickDist) {
			var target = Math.max(1, Number(tickDist) || 72);
			var lo = Number(minTickDist);
			var hi = Number(maxTickDist);
			if (!(lo > 0)) lo = target * .72;
			if (!(hi > lo)) hi = target * 1.45;
			return {
				target,
				min: lo,
				max: hi
			};
		}
		function tickSpacingScore(px, band) {
			var spacing = Math.max(1e-9, Number(px) || 0);
			if (spacing >= band.min && spacing <= band.max) {
				var center = Math.sqrt(band.min * band.max);
				return Math.abs(Math.log(spacing / center)) * .01;
			}
			if (spacing < band.min) return Math.log(band.min / spacing);
			return Math.log(spacing / band.max);
		}
		function chooseAxisTickStep(dataPerPixel, tickDist, hints, minTickDist, maxTickDist) {
			var band = tickDistanceBand(tickDist, minTickDist, maxTickDist);
			var dataScale = positiveMagnitude(dataPerPixel);
			var target = dataScale * Math.max(1, Number(tickDist) || 72);
			var rawHints = Array.isArray(hints) && hints.length ? hints : [
				1,
				2,
				5
			];
			var cleanHints = [];
			for (var hi = 0; hi < rawHints.length; hi += 1) {
				var hv = Math.abs(Number(rawHints[hi]) || 0);
				if (hv > 0) cleanHints.push(hv);
			}
			if (!cleanHints.length) cleanHints = [
				1,
				2,
				5
			];
			var pow = Math.floor(Math.log(target) / Math.LN10);
			var best = cleanHints[0] * Math.pow(10, pow);
			var bestScore = Infinity;
			for (var pi = pow - 1; pi <= pow + 1; pi += 1) {
				var scale = Math.pow(10, pi);
				for (var ci = 0; ci < cleanHints.length; ci += 1) {
					var cand = cleanHints[ci] * scale;
					var score = tickSpacingScore(cand / dataScale, band);
					if (score < bestScore) {
						bestScore = score;
						best = cand;
					}
				}
			}
			return best;
		}
		function stripMathLabelText(label) {
			return String(label || "").replace(/\$/g, "").replace(/\\cdot/g, "*").replace(/\{|\}/g, "");
		}
		function estimateTickLabelWidthPx(label, fontSize) {
			var text = stripMathLabelText(label);
			return Math.max(1, text.length) * Math.max(1, Number(fontSize) || 11) * .58 + 8;
		}
		function maxEstimatedTickLabelWidthPx(values, mode, minValue, maxValue, offset, step, fontSize) {
			var maxW = 0;
			for (var i = 0; i < values.length; i += 1) {
				var label = axisTickLabelWithOffset(values[i], mode, minValue, maxValue, offset, step);
				maxW = Math.max(maxW, estimateTickLabelWidthPx(label, fontSize));
			}
			return maxW;
		}
		function chooseReadableLinearTickStep(minValue, maxValue, step, explicitValues, mode, hints, pixelSpan, tickDist, minTickDist, maxTickDist, fontSize) {
			var current = positiveMagnitude(step);
			var span = Math.max(1, Number(pixelSpan) || 1);
			var dataPerPixel = (Number(maxValue) - Number(minValue)) / span;
			if (explicitAxisTicks(explicitValues) || !(dataPerPixel > 0)) return current;
			var rawHints = Array.isArray(hints) && hints.length ? hints : [
				1,
				2,
				5
			];
			var safeMinDist = Math.max(1, Number(minTickDist) || 0);
			for (var tries = 0; tries < 12; tries += 1) {
				var vals = axisTickValuesForMode(minValue, maxValue, current, null, mode, false, hints, span, tickDist, minTickDist, maxTickDist);
				if (vals.length < 2) return current;
				var labelMinDist = maxEstimatedTickLabelWidthPx(vals, mode, minValue, maxValue, axisLabelOffset(vals, minValue, maxValue), current, fontSize) + 8;
				if (current / positiveMagnitude(dataPerPixel) >= Math.max(safeMinDist, labelMinDist)) return current;
				current = chooseAxisTickStep(dataPerPixel, Math.max(Number(tickDist) || 72, labelMinDist), rawHints, Math.max(safeMinDist, labelMinDist), maxTickDist);
				if (!(current > 0)) return step;
				dataPerPixel = (Number(maxValue) - Number(minValue)) / span;
			}
			return current;
		}
		function firstAxisTick(minValue, step) {
			return Math.ceil((minValue - step * 1e-9) / step) * step;
		}
		function explicitAxisTicks(values) {
			if (!Array.isArray(values)) return null;
			var out = [];
			for (var i = 0; i < values.length; i += 1) {
				var v = Number(values[i]);
				if (Number.isFinite(v)) out.push(v);
			}
			return out;
		}
		function axisTickValues(minValue, maxValue, step, explicitValues) {
			var out = [];
			var explicit = explicitAxisTicks(explicitValues);
			var maxTicks = 1e3;
			if (explicit) {
				for (var i = 0; i < explicit.length && out.length < maxTicks; i += 1) {
					var ev = explicit[i];
					if (ev >= minValue - step * 1e-9 && ev <= maxValue + step * 1e-9 && Math.abs(ev) >= step * 1e-10) out.push(ev);
				}
				return out;
			}
			for (var v = firstAxisTick(minValue, step); v <= maxValue + step * 1e-9 && out.length < maxTicks; v += step) out.push(Math.abs(v) < step * 1e-10 ? 0 : v);
			return out;
		}
		function axisTickValuesNoZero(minValue, maxValue, step, explicitValues) {
			var raw = axisTickValues(minValue, maxValue, step, explicitValues);
			var out = [];
			for (var i = 0; i < raw.length; i += 1) if (Math.abs(raw[i]) >= step * 1e-10) out.push(raw[i]);
			return out;
		}
		function decimalPlacesForStep(step) {
			var s = Math.abs(Number(step) || 0);
			if (!Number.isFinite(s) || s <= 0) return null;
			var text = String(Number(s.toPrecision(12)));
			var exp = text.match(/e([+-]?\d+)$/i);
			if (exp) return Math.max(0, -Number(exp[1]));
			var dot = text.indexOf(".");
			return dot >= 0 ? Math.min(12, text.length - dot - 1) : 0;
		}
		function snapTickValueForLabel(value, step) {
			var v = Number(value) || 0;
			var s = Math.abs(Number(step) || 0);
			if (!Number.isFinite(s) || s <= 0) return v;
			return Math.round(v / s) * s;
		}
		function formatScientificBody(value) {
			var v = Number(value) || 0;
			if (v === 0) return "0";
			var sign = v < 0 ? "-" : "";
			var av = Math.abs(v);
			if (av >= .01 && av < 1e4) return sign + String(Number(av.toPrecision(6)));
			var exponent = Math.floor(Math.log(av) / Math.LN10);
			var mantissa = Number((av / Math.pow(10, exponent)).toPrecision(6));
			if (Math.abs(mantissa - 10) < 1e-8) {
				mantissa = 1;
				exponent += 1;
			}
			if (Math.abs(mantissa - 1) < 1e-8) return sign + "10^{" + String(exponent) + "}";
			return sign + String(mantissa) + " \\cdot 10^{" + String(exponent) + "}";
		}
		function formatPlainAxisTickLabel(value) {
			return String(value).replace(/^-/, "−");
		}
		function formatAxisTickLabel(value, step) {
			var v = Number(value) || 0;
			var decimals = decimalPlacesForStep(step);
			if (decimals !== null) v = snapTickValueForLabel(v, step);
			if (Math.abs(v) < positiveMagnitude(step) * 1e-10) v = 0;
			var av = Math.abs(v);
			if (av !== 0 && (av < .01 || av >= 1e4)) return "$" + formatScientificBody(v) + "$";
			if (decimals !== null) {
				if (decimals === 0 || Math.abs(v - Math.round(v)) < 1e-12) return formatPlainAxisTickLabel(Math.round(v));
				return formatPlainAxisTickLabel(Number(v.toFixed(decimals)).toFixed(decimals).replace(/\.?0+$/, ""));
			}
			if (Math.abs(v - Math.round(v)) < 1e-12) return formatPlainAxisTickLabel(Math.round(v));
			return formatPlainAxisTickLabel(Number(v.toPrecision(6)));
		}
		function formatOffsetLabel(offset) {
			var v = Number(offset) || 0;
			if (v === 0) return "";
			return "$" + (v > 0 ? "+ " : "- ") + formatScientificBody(Math.abs(v)) + "$";
		}
		function positiveMagnitude(value) {
			var magnitude = Math.abs(Number(value));
			return Number.isFinite(magnitude) && magnitude > 0 ? magnitude : Number.MIN_VALUE;
		}
		function axisLabelOffset(values, minValue, maxValue) {
			if (!Array.isArray(values) || values.length < 2) return 0;
			var lo = Number(minValue);
			var hi = Number(maxValue);
			if (!Number.isFinite(lo) || !Number.isFinite(hi) || !(hi > lo)) return 0;
			var minDelta = Infinity;
			for (var i = 1; i < values.length; i += 1) {
				var d = Math.abs(Number(values[i]) - Number(values[i - 1]));
				if (d > 0 && d < minDelta) minDelta = d;
			}
			if (!Number.isFinite(minDelta) || minDelta <= 0) return 0;
			var center = (lo + hi) * .5;
			if (Math.abs(center) / minDelta < 1e5) return 0;
			var offset = Math.floor(lo / minDelta) * minDelta;
			if (!Number.isFinite(offset) || offset === 0) return 0;
			return offset;
		}
		function formatLogAxisTickLabel(value, minValue, maxValue) {
			var v = Number(value) || 0;
			if (v === 0) return "";
			var lo = Math.abs(Number(minValue) || 0);
			var hi = Math.abs(Number(maxValue) || 0);
			if ((lo > 0 && hi > lo ? hi / lo : Infinity) < 10) return formatAxisTickLabel(value);
			var av = Math.abs(v);
			if (av >= .01 && av < 1e4) return formatPlainAxisTickLabel((v < 0 ? "-" : "") + String(Number(av.toPrecision(6))));
			return "$" + formatScientificBody(v) + "$";
		}
		function isSubDecadePositiveRange(minValue, maxValue) {
			var lo = Number(minValue);
			var hi = Number(maxValue);
			return lo > 0 && hi > lo && hi / lo < 10;
		}
		function isLogTickMode(mode) {
			return String(mode || "linear").toLowerCase() === "log";
		}
		function axisTickLabelForMode(value, mode, minValue, maxValue) {
			return isLogTickMode(mode) ? formatLogAxisTickLabel(value, minValue, maxValue) : formatAxisTickLabel(value);
		}
		function axisTickLabelWithOffset(value, mode, minValue, maxValue, offset, step) {
			var off = Number(offset) || 0;
			if (off !== 0) {
				var delta = Number(value) - off;
				if (Math.abs(delta) < Math.abs(Number(value) || 0) * 1e-12) delta = 0;
				return formatAxisTickLabel(delta, step);
			}
			if (!isLogTickMode(mode) || isSubDecadePositiveRange(minValue, maxValue)) return formatAxisTickLabel(value, step);
			return axisTickLabelForMode(value, mode, minValue, maxValue);
		}
		function positiveLogTickValues(minValue, maxValue, explicitValues, hints) {
			var explicit = explicitAxisTicks(explicitValues);
			if (explicit) {
				var filtered = [];
				for (var ei = 0; ei < explicit.length; ei += 1) if (explicit[ei] > 0 && explicit[ei] >= minValue * .999999 && explicit[ei] <= maxValue * 1.000001) filtered.push(explicit[ei]);
				return filtered;
			}
			var minV = Math.max(Number.MIN_VALUE, Number(minValue) || 0);
			var maxV = Number(maxValue) || 0;
			if (!(maxV > minV) || minV <= 0) return [];
			var pixelSpan = Math.max(1, Number(arguments[4]) || 1);
			var band = tickDistanceBand(Math.max(1, Number(arguments[5]) || 72), arguments[6], arguments[7]);
			var rawHints = Array.isArray(hints) && hints.length ? hints : [
				1,
				2,
				5
			];
			var cleanHints = [];
			for (var hi = 0; hi < rawHints.length; hi += 1) {
				var hv = Math.abs(Number(rawHints[hi]) || 0);
				if (hv > 0 && hv <= 5) cleanHints.push(hv);
			}
			if (!cleanHints.length) cleanHints = [
				1,
				2,
				5
			];
			cleanHints.sort(function(a, b) {
				return a - b;
			});
			function mantissasForHint(hint) {
				var jump = Math.max(1, Number(hint) || 1);
				var values = [1];
				var cur = 1;
				if (jump > 1 && jump < 10) {
					cur = jump;
					if (cur <= 5) values.push(cur);
				}
				while (true) {
					var next = cur + jump;
					if (!(next < 10)) break;
					if (10 - next < jump - 1e-9) break;
					if (next <= 5) values.push(next);
					cur = next;
				}
				return values;
			}
			var patternCandidates = [];
			for (var hix = 0; hix < cleanHints.length; hix += 1) {
				var h = cleanHints[hix];
				patternCandidates.push({
					hint: h,
					mantissas: mantissasForHint(h)
				});
			}
			if (!patternCandidates.length) patternCandidates = [{
				hint: 5,
				mantissas: [1, 5]
			}];
			var bestPattern = patternCandidates[patternCandidates.length - 1];
			var bestScore = Infinity;
			function ticksForPattern(pattern) {
				var values = [];
				var seen = Object.create(null);
				function addTick(v) {
					if (!(v > 0) || v < minV * .999999 || v > maxV * 1.000001) return;
					var key = String(Number(v.toPrecision(12)));
					if (seen[key]) return;
					seen[key] = true;
					values.push(v);
				}
				var e0 = Math.floor(Math.log(minV) / Math.LN10) - 1;
				var e1 = Math.ceil(Math.log(maxV) / Math.LN10) + 1;
				var decadeStep = Math.max(1, Number(pattern.decadeStep) || 1);
				for (var e = Math.ceil((e0 - decadeStep * 1e-9) / decadeStep) * decadeStep; e <= e1 && values.length < 1e4; e += decadeStep) {
					var scale = Math.pow(10, e);
					addTick(scale);
					if (decadeStep === 1) for (var mi = 0; mi < pattern.mantissas.length && values.length < 1e4; mi += 1) addTick(pattern.mantissas[mi] * scale);
				}
				values.sort(function(a, b) {
					return a - b;
				});
				return values;
			}
			function avgPatternPixelDistance(pattern) {
				var values = [];
				var decadeStep = Math.max(1, Number(pattern.decadeStep) || 1);
				for (var e = 0; e <= 24 && values.length < 1e3; e += decadeStep) {
					var scale = Math.pow(10, e);
					values.push(scale);
					if (decadeStep === 1) for (var mi = 0; mi < pattern.mantissas.length; mi += 1) values.push(pattern.mantissas[mi] * scale);
				}
				values.sort(function(a, b) {
					return a - b;
				});
				if (values.length < 2) return Infinity;
				var ratio = Math.max(1.000001, maxV / minV);
				var l0 = 0;
				var l1 = Math.log(ratio) / Math.LN10;
				var prev = (Math.log(values[0]) / Math.LN10 - l0) / Math.max(1e-12, l1 - l0) * pixelSpan;
				var total = 0;
				var count = 0;
				for (var i = 1; i < values.length; i += 1) {
					var cur = (Math.log(values[i]) / Math.LN10 - l0) / Math.max(1e-12, l1 - l0) * pixelSpan;
					total += Math.abs(cur - prev);
					count += 1;
					prev = cur;
				}
				return count ? total / count : Infinity;
			}
			var logRange = Math.max(0, Math.log(maxV / minV) / Math.LN10);
			var exponentSteps = [1];
			var stepSeen = { "1": true };
			var stepLimit = Math.max(1, Math.min(300, Math.ceil(logRange)));
			for (var dhi = 0; dhi < cleanHints.length; dhi += 1) {
				var baseStep = Math.max(1, Math.round(cleanHints[dhi]));
				var decadeScale = 1;
				var s = baseStep * decadeScale;
				while (s <= stepLimit) {
					var skey = String(s);
					if (!stepSeen[skey]) {
						stepSeen[skey] = true;
						exponentSteps.push(s);
					}
					if (decadeScale > stepLimit / 10) break;
					decadeScale *= 10;
					s = baseStep * decadeScale;
				}
			}
			exponentSteps.sort(function(a, b) {
				return a - b;
			});
			var expandedPatterns = [];
			for (var epi = 0; epi < exponentSteps.length; epi += 1) for (var ppi = 0; ppi < patternCandidates.length; ppi += 1) expandedPatterns.push({
				hint: patternCandidates[ppi].hint,
				mantissas: patternCandidates[ppi].mantissas,
				decadeStep: exponentSteps[epi]
			});
			for (var pi = 0; pi < expandedPatterns.length; pi += 1) {
				var candidate = ticksForPattern(expandedPatterns[pi]);
				if (!candidate.length) continue;
				var score = tickSpacingScore(avgPatternPixelDistance(expandedPatterns[pi]), band);
				if (candidate.length === 1) score += 3;
				if (score < bestScore) {
					bestScore = score;
					bestPattern = expandedPatterns[pi];
				}
			}
			return ticksForPattern(bestPattern).slice(0, 1e3);
		}
		function signedLogTickValues(minValue, maxValue, explicitValues, hints, pixelSpan, tickDist, minTickDist, maxTickDist) {
			var explicit = explicitAxisTicks(explicitValues);
			if (explicit) {
				var filtered = [];
				for (var ei = 0; ei < explicit.length; ei += 1) if (explicit[ei] !== 0 && explicit[ei] >= minValue && explicit[ei] <= maxValue) filtered.push(explicit[ei]);
				return filtered;
			}
			var out = [];
			var maxAbs = Math.max(Math.abs(Number(minValue) || 0), Math.abs(Number(maxValue) || 0));
			var crossingZeroMinAbs = maxAbs > 0 ? maxAbs / 1e3 : 1;
			if (minValue < 0) {
				var neg = positiveLogTickValues(maxValue >= 0 ? crossingZeroMinAbs : Math.max(Number.MIN_VALUE, Math.abs(maxValue)), Math.abs(minValue), null, hints, pixelSpan, tickDist, minTickDist, maxTickDist);
				for (var ni = neg.length - 1; ni >= 0; ni -= 1) {
					var nv = -neg[ni];
					if (nv >= minValue && nv <= maxValue) out.push(nv);
				}
			}
			if (maxValue > 0) {
				var pos = positiveLogTickValues(minValue <= 0 ? crossingZeroMinAbs : Math.max(Number.MIN_VALUE, minValue), maxValue, null, hints, pixelSpan, tickDist, minTickDist, maxTickDist);
				for (var pi = 0; pi < pos.length; pi += 1) if (pos[pi] >= minValue && pos[pi] <= maxValue) out.push(pos[pi]);
			}
			return out;
		}
		function axisTickValuesForMode(minValue, maxValue, step, explicitValues, mode, signedLog, hints, pixelSpan, tickDist, minTickDist, maxTickDist) {
			if (isLogTickMode(mode)) {
				if (!signedLog && isSubDecadePositiveRange(minValue, maxValue)) return axisTickValues(minValue, maxValue, step, explicitValues);
				return signedLog ? signedLogTickValues(minValue, maxValue, explicitValues, hints, pixelSpan, tickDist, minTickDist, maxTickDist) : positiveLogTickValues(minValue, maxValue, explicitValues, hints, pixelSpan, tickDist, minTickDist, maxTickDist);
			}
			return axisTickValues(minValue, maxValue, step, explicitValues);
		}
		function axisTickValuesNoZeroForMode(minValue, maxValue, step, explicitValues, mode, signedLog, hints, pixelSpan, tickDist, minTickDist, maxTickDist) {
			if (isLogTickMode(mode)) {
				if (!signedLog && isSubDecadePositiveRange(minValue, maxValue)) return axisTickValuesNoZero(minValue, maxValue, step, explicitValues);
				return signedLog ? signedLogTickValues(minValue, maxValue, explicitValues, hints, pixelSpan, tickDist, minTickDist, maxTickDist) : positiveLogTickValues(minValue, maxValue, explicitValues, hints, pixelSpan, tickDist, minTickDist, maxTickDist);
			}
			return axisTickValuesNoZero(minValue, maxValue, step, explicitValues);
		}
		function axisCrosshairTickValuesForMode(minValue, maxValue, step, explicitValues, mode, hints, pixelSpan, tickDist, minTickDist, maxTickDist) {
			var values = axisTickValuesNoZeroForMode(minValue, maxValue, step, explicitValues, mode, false, hints, pixelSpan, tickDist, minTickDist, maxTickDist);
			if (!isLogTickMode(mode)) return values;
			return values.filter(function(v) {
				return Math.abs((Number(v) || 0) - 1) > 1e-12;
			});
		}
		function axisValueToUnit(value, minValue, maxValue, mode) {
			var v = Number(value);
			var lo = Number(minValue);
			var hi = Number(maxValue);
			if (isLogTickMode(mode) && v > 0 && lo > 0 && hi > lo) {
				var l0 = Math.log(lo) / Math.LN10;
				var l1 = Math.log(hi) / Math.LN10;
				return (Math.log(v) / Math.LN10 - l0) / Math.max(1e-12, l1 - l0);
			}
			return (v - lo) / Math.max(1e-12, hi - lo);
		}
		function axisUnitToValue(unit, minValue, maxValue, mode) {
			var u = Number(unit);
			var lo = Number(minValue);
			var hi = Number(maxValue);
			if (isLogTickMode(mode) && lo > 0 && hi > lo) {
				var l0 = Math.log(lo) / Math.LN10;
				var l1 = Math.log(hi) / Math.LN10;
				return Math.pow(10, l0 + u * (l1 - l0));
			}
			return lo + u * (hi - lo);
		}
		function polarRadialRange(cfg) {
			var rMin = Math.max(0, Number(cfg && cfg.r_min) || 0);
			var rMax = Number(cfg && cfg.r_max);
			if (!Number.isFinite(rMax) || !(rMax > rMin)) rMax = rMin + 1;
			return {
				min: rMin,
				max: rMax,
				span: Math.max(1e-9, rMax - rMin)
			};
		}
		function applyPolarRadialRange(cfg, rMin, rMax) {
			if (!cfg) return false;
			rMin = Math.max(0, Number(rMin) || 0);
			rMax = Number(rMax);
			if (!Number.isFinite(rMax) || !(rMax > rMin + 1e-9)) rMax = rMin + 1e-9;
			cfg.r_min = rMin;
			cfg.r_max = rMax;
			return true;
		}
		function normalizeSignedAngleDeg(angleDeg) {
			var angle = Number(angleDeg) || 0;
			while (angle <= -180) angle += 360;
			while (angle > 180) angle -= 360;
			return angle;
		}
		function signedAngleDiffDeg(aDeg, bDeg) {
			return Math.abs(normalizeSignedAngleDeg(aDeg - bDeg));
		}
		function snapSignedAngleDegWithinThreshold(rawAngleDeg, thresholdDeg, snapTargets) {
			var angle = normalizeSignedAngleDeg(rawAngleDeg);
			var targets = Array.isArray(snapTargets) && snapTargets.length ? snapTargets : [
				-180,
				-90,
				0,
				90,
				180
			];
			var best = targets[0];
			var bestDiff = signedAngleDiffDeg(angle, best);
			for (var i = 1; i < targets.length; i += 1) {
				var diff = signedAngleDiffDeg(angle, targets[i]);
				if (diff < bestDiff) {
					best = targets[i];
					bestDiff = diff;
				}
			}
			return bestDiff <= Math.max(0, Number(thresholdDeg) || 0) ? normalizeSignedAngleDeg(best) : rawAngleDeg;
		}
		function rawPolarThetaOffset(cfg) {
			var theta = Number(cfg && cfg.__raw_theta_offset_rad);
			if (!Number.isFinite(theta)) theta = Number(cfg && cfg.theta_offset_rad);
			return Number.isFinite(theta) ? theta : 0;
		}
		function polarThetaOffset(cfg) {
			var theta = rawPolarThetaOffset(cfg);
			var snapDeg = Number(cfg && cfg.theta_snap_angle_deg);
			if (!Number.isFinite(snapDeg)) snapDeg = Number(cfg && cfg.rotation_snap_angle_deg);
			if (!Number.isFinite(snapDeg)) snapDeg = 8;
			return snapSignedAngleDegWithinThreshold(theta * 180 / Math.PI, snapDeg, [
				-180,
				-90,
				0,
				90,
				180
			]) * Math.PI / 180;
		}
		function setPolarThetaOffset(cfg, theta) {
			if (!cfg) return false;
			theta = Number(theta);
			cfg.__raw_theta_offset_rad = Number.isFinite(theta) ? theta : 0;
			cfg.theta_offset_rad = polarThetaOffset(cfg);
			return true;
		}
		function buildAxisBoxTickState(spec) {
			var cfg = spec || {};
			var width = Math.max(1, Number(cfg.width) || 1);
			var height = Math.max(1, Number(cfg.height) || 1);
			var xMin = Number(cfg.x_min);
			var xMax = Number(cfg.x_max);
			var yMin = Number(cfg.y_min);
			var yMax = Number(cfg.y_max);
			var out = {};
			if (xMax > xMin) {
				var xStep = chooseAxisTickStep((xMax - xMin) / width, cfg.dist, cfg.hints, cfg.min_dist, cfg.max_dist);
				xStep = chooseReadableLinearTickStep(xMin, xMax, xStep, cfg.x_ticks, cfg.x_mode, cfg.hints, width, cfg.dist, cfg.min_dist, cfg.max_dist, cfg.tick_label_font_size);
				var xValues = axisTickValuesForMode(xMin, xMax, xStep, cfg.x_ticks, cfg.x_mode, false, cfg.hints, width, cfg.dist, cfg.min_dist, cfg.max_dist);
				out.x = {
					step: xStep,
					values: xValues,
					offset: axisLabelOffset(xValues, xMin, xMax)
				};
			}
			if (yMax > yMin) {
				var yStep = chooseAxisTickStep((yMax - yMin) / height, cfg.dist, cfg.hints, cfg.min_dist, cfg.max_dist);
				var yValues = axisTickValuesForMode(yMin, yMax, yStep, cfg.y_ticks, cfg.y_mode, false, cfg.hints, height, cfg.dist, cfg.min_dist, cfg.max_dist);
				out.y = {
					step: yStep,
					values: yValues,
					offset: axisLabelOffset(yValues, yMin, yMax)
				};
			}
			return out;
		}
		function buildAxisCrosshairTickState(spec) {
			var cfg = spec || {};
			var width = Math.max(1, Number(cfg.width) || 1);
			var height = Math.max(1, Number(cfg.height) || 1);
			var xVisibleMin = Number(cfg.x_visible_min);
			var xVisibleMax = Number(cfg.x_visible_max);
			var yVisibleMin = Number(cfg.y_visible_min);
			var yVisibleMax = Number(cfg.y_visible_max);
			var out = {};
			if (xVisibleMax > xVisibleMin) {
				var xStep = chooseAxisTickStep((xVisibleMax - xVisibleMin) / width, cfg.dist, cfg.hints, cfg.min_dist, cfg.max_dist);
				xStep = chooseReadableLinearTickStep(xVisibleMin, xVisibleMax, xStep, cfg.x_ticks, cfg.x_mode, cfg.hints, width, cfg.dist, cfg.min_dist, cfg.max_dist, cfg.tick_label_font_size);
				var xValues = axisCrosshairTickValuesForMode(xVisibleMin, xVisibleMax, xStep, cfg.x_ticks, cfg.x_mode, cfg.hints, width, cfg.dist, cfg.min_dist, cfg.max_dist);
				out.x = {
					step: xStep,
					values: xValues,
					offset: axisLabelOffset(xValues, xVisibleMin, xVisibleMax),
					visible_min: xVisibleMin,
					visible_max: xVisibleMax
				};
			}
			if (yVisibleMax > yVisibleMin) {
				var yStep = chooseAxisTickStep((yVisibleMax - yVisibleMin) / height, cfg.dist, cfg.hints, cfg.min_dist, cfg.max_dist);
				var yValues = axisCrosshairTickValuesForMode(yVisibleMin, yVisibleMax, yStep, cfg.y_ticks, cfg.y_mode, cfg.hints, height, cfg.dist, cfg.min_dist, cfg.max_dist);
				out.y = {
					step: yStep,
					values: yValues,
					offset: axisLabelOffset(yValues, yVisibleMin, yVisibleMax),
					visible_min: yVisibleMin,
					visible_max: yVisibleMax
				};
			}
			return out;
		}
		return {
			tickDistanceBand,
			tickSpacingScore,
			chooseAxisTickStep,
			chooseReadableLinearTickStep,
			axisTickValuesForMode,
			axisCrosshairTickValuesForMode,
			axisTickLabelWithOffset,
			axisTickLabelForMode,
			axisLabelOffset,
			axisValueToUnit,
			axisUnitToValue,
			polarRadialRange,
			applyPolarRadialRange,
			polarThetaOffset,
			setPolarThetaOffset,
			buildAxisBoxTickState,
			buildAxisCrosshairTickState,
			isLogTickMode,
			formatAxisTickLabel,
			formatOffsetLabel
		};
	});
})))(), 1)).default ?? globalThis.VfAxis2DTicks;
if (!axis2dTicks) throw new Error("VKF axis2d ticks failed to initialize.");
//#endregion
//#region browser-ui/vf-visible-grid-snap.mjs
function nearestVisibleGridSnap(scene, screen) {
	if (!scene || scene.mode === "none" || !isPoint(screen)) return null;
	const candidates = visibleGridSnapCandidates(scene);
	let nearest = null;
	let nearestDistance = Infinity;
	for (const candidate of candidates) {
		const distance = Math.hypot(candidate.at[0] - screen[0], candidate.at[1] - screen[1]);
		if (distance >= nearestDistance) continue;
		nearest = candidate;
		nearestDistance = distance;
	}
	return nearest && Object.freeze({
		...nearest,
		distance: nearestDistance
	});
}
function visibleGridSnapCandidates(scene) {
	if (!scene || scene.mode === "none") return Object.freeze([]);
	const candidates = [];
	const seen = /* @__PURE__ */ new Set();
	const append = (at, world = null) => {
		if (!isPoint(at)) return;
		const key = `${at[0].toFixed(6)}:${at[1].toFixed(6)}`;
		if (seen.has(key)) return;
		seen.add(key);
		candidates.push(Object.freeze({
			at: Object.freeze([at[0], at[1]]),
			...Array.isArray(world) ? { world: Object.freeze([...world]) } : {}
		}));
	};
	for (const point of scene.points || []) append(point.at, point.world);
	const lines = (scene.lines || []).filter(validLine);
	const circles = (scene.circles || []).filter(validCircle);
	for (let left = 0; left < lines.length; left += 1) {
		for (let right = left + 1; right < lines.length; right += 1) {
			const at = segmentIntersection(lines[left], lines[right]);
			if (!at) continue;
			append(at);
		}
		for (const circle of circles) for (const at of segmentCircleIntersections(lines[left], circle)) append(at);
	}
	return Object.freeze(candidates);
}
function segmentIntersection(left, right) {
	const a = subtract$4(left.to, left.from);
	const b = subtract$4(right.to, right.from);
	const denominator = cross(a, b);
	if (Math.abs(denominator) <= 1e-9) return null;
	const relative = subtract$4(right.from, left.from);
	const t = cross(relative, b) / denominator;
	const u = cross(relative, a) / denominator;
	if (t < -1e-9 || t > 1.000000001 || u < -1e-9 || u > 1.000000001) return null;
	return [left.from[0] + t * a[0], left.from[1] + t * a[1]];
}
function segmentCircleIntersections(line, circle) {
	const delta = subtract$4(line.to, line.from);
	const relative = subtract$4(line.from, circle.center);
	const a = dot$2(delta, delta);
	const b = 2 * dot$2(relative, delta);
	const c = dot$2(relative, relative) - circle.radius * circle.radius;
	const discriminant = b * b - 4 * a * c;
	if (!(a > 0) || discriminant < -1e-9) return [];
	const root = Math.sqrt(Math.max(0, discriminant));
	return [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter((value, index, values) => value >= -1e-9 && value <= 1.000000001 && (index === 0 || Math.abs(value - values[0]) > 1e-9)).map((value) => [line.from[0] + value * delta[0], line.from[1] + value * delta[1]]);
}
function validLine(line) {
	return isPoint(line?.from) && isPoint(line?.to);
}
function validCircle(circle) {
	return isPoint(circle?.center) && Number.isFinite(circle?.radius) && circle.radius > 0;
}
function subtract$4(left, right) {
	return [left[0] - right[0], left[1] - right[1]];
}
function dot$2(left, right) {
	return left[0] * right[0] + left[1] * right[1];
}
function cross(left, right) {
	return left[0] * right[1] - left[1] * right[0];
}
function isPoint(point) {
	return Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]);
}
//#endregion
//#region browser-ui/vf-coordinate-view.mjs
var DEFAULT_GRID_SPACING$1 = 72;
var DEFAULT_VERTEX_RADIUS$1 = 7;
var MIN_VIEW_SCALE = 1e-300;
var MAX_VIEW_SCALE = 1e300;
var MAX_GRID_LINES = 400;
var ROTATION_SNAP_STEP = Math.PI / 12;
var { buildAxisCrosshairTickState } = axis2dTicks;
function createCoordinateView({ bounds, gridSpacing = DEFAULT_GRID_SPACING$1, minScale = MIN_VIEW_SCALE, maxScale = MAX_VIEW_SCALE }) {
	let viewport = {
		width: 1,
		height: 1
	};
	let transform = normalizeVkfViewTransform();
	let referenceScale = 1;
	let initialized = false;
	function resize(width, height) {
		const next = {
			width: Math.max(1, finite$2(width, 1)),
			height: Math.max(1, finite$2(height, 1))
		};
		if (!initialized) {
			transform = initialTransform(bounds, next, minScale, maxScale);
			referenceScale = uniformScale(transform);
			initialized = true;
		} else if (next.width !== viewport.width || next.height !== viewport.height) transform = applyVkfViewGesture(transform, { translation: [(next.width - viewport.width) / 2, (next.height - viewport.height) / 2] });
		viewport = next;
		return snapshot();
	}
	function worldToScreen(world) {
		return transformVkfViewPoint([world[0], -world[1]], transform);
	}
	function screenToWorld(screen) {
		const local = inverseTransformVkfViewPoint(screen, transform);
		return [local[0], -local[1]];
	}
	function screenBasis(world) {
		const origin = worldToScreen(world);
		const xPoint = worldToScreen([world[0] + 1, world[1]]);
		const yPoint = worldToScreen([world[0], world[1] + 1]);
		return Object.freeze({
			x: Object.freeze(unitVector(subtract$3(xPoint, origin))),
			y: Object.freeze(unitVector(subtract$3(yPoint, origin)))
		});
	}
	function grid() {
		const corners = [
			[0, 0],
			[viewport.width, 0],
			[viewport.width, viewport.height],
			[0, viewport.height]
		].map(screenToWorld);
		const xRange = extent(corners.map(([x]) => x));
		const yRange = extent(corners.map(([, y]) => y));
		const tickState = buildAxisCrosshairTickState({
			width: viewport.width,
			height: viewport.height,
			x_visible_min: xRange[0],
			x_visible_max: xRange[1],
			y_visible_min: yRange[0],
			y_visible_max: yRange[1],
			x_mode: "linear",
			y_mode: "linear",
			hints: [
				1,
				2,
				5
			],
			dist: gridSpacing,
			min_dist: gridSpacing * .72,
			max_dist: gridSpacing * 1.45,
			tick_label_font_size: 11
		});
		const xInterval = tickState.x?.step || gridSpacing / uniformScale(transform);
		const yInterval = tickState.y?.step || xInterval;
		const lines = [];
		appendGridValues(lines, gridValues(tickState.x?.values, xRange), (value) => ({
			axis: nearlyZero(value, xInterval),
			interval: xInterval,
			orientation: "vertical",
			value,
			from: worldToScreen([value, yRange[0]]),
			to: worldToScreen([value, yRange[1]])
		}));
		appendGridValues(lines, gridValues(tickState.y?.values, yRange), (value) => ({
			axis: nearlyZero(value, yInterval),
			interval: yInterval,
			orientation: "horizontal",
			value,
			from: worldToScreen([xRange[0], value]),
			to: worldToScreen([xRange[1], value])
		}));
		return Object.freeze({
			interval: xInterval,
			xInterval,
			yInterval,
			lines: Object.freeze(lines)
		});
	}
	function resolvePlacement(screen, { shift = false, vertexRadius = DEFAULT_VERTEX_RADIUS$1, vertices = [], gridScene = null, gridScreenToWorld = screenToWorld } = {}) {
		const world = screenToWorld(screen);
		const vertex = nearestRenderedVertex$1(screen, vertices, worldToScreen, vertexRadius);
		if (vertex) return Object.freeze({
			world: vertex.world,
			snap: "vertex",
			targetPoint: vertex.index,
			screenTarget: vertex.screen
		});
		if (!shift) return Object.freeze({
			world,
			snap: "none",
			targetPoint: null,
			screenTarget: screen
		});
		if (gridScene) {
			const candidate = nearestVisibleGridSnap(gridScene, screen);
			if (!candidate) return Object.freeze({
				world,
				snap: "none",
				targetPoint: null,
				screenTarget: screen
			});
			return Object.freeze({
				world: Object.freeze(candidate.world || gridScreenToWorld(candidate.at)),
				snap: "intersection",
				targetPoint: null,
				screenTarget: candidate.at
			});
		}
		const { xInterval, yInterval } = grid();
		const crossing = [Math.round(world[0] / xInterval) * xInterval, Math.round(world[1] / yInterval) * yInterval];
		return Object.freeze({
			world: crossing,
			snap: "intersection",
			targetPoint: null,
			screenTarget: worldToScreen(crossing)
		});
	}
	function applyGesture(gesture = {}, { shift = false, snapRotation = false, snapScale = false } = {}) {
		const requestedScale = finite$2(gesture.scale, 1);
		const currentScale = uniformScale(transform);
		const rawNextScale = currentScale * requestedScale;
		const nextScale = clamp$1(shift && snapScale ? referenceScale * snapRelativeScale(rawNextScale / referenceScale) : rawNextScale, minScale, maxScale);
		const requestedRotation = finite$2(gesture.rotation, 0);
		const nextRotation = shift && snapRotation ? snapRotationDelta(transform.rotation + requestedRotation) : transform.rotation + requestedRotation;
		transform = applyVkfViewGesture(transform, {
			...gesture,
			scale: nextScale / currentScale,
			rotation: nextRotation - transform.rotation
		});
		return snapshot();
	}
	function zoomAt(screen, wheelDelta, { shift = false } = {}) {
		return applyGesture({
			origin: screen,
			scale: Math.exp(-finite$2(wheelDelta, 0) * .0015)
		}, {
			shift,
			snapScale: true
		});
	}
	function pan(previous, current) {
		return applyGesture({ translation: [current[0] - previous[0], current[1] - previous[1]] });
	}
	function rotate(previous, current, { shift = false } = {}) {
		const origin = worldToScreen([0, 0]);
		const previousVector = [previous[0] - origin[0], previous[1] - origin[1]];
		const currentVector = [current[0] - origin[0], current[1] - origin[1]];
		const previousRadius = Math.hypot(...previousVector);
		const currentRadius = Math.hypot(...currentVector);
		return applyGesture({
			origin,
			rotation: previousRadius < 12 || currentRadius < 12 ? (current[0] - previous[0]) * .01 : Math.atan2(currentVector[1], currentVector[0]) - Math.atan2(previousVector[1], previousVector[0])
		}, {
			shift,
			snapRotation: true
		});
	}
	function transformBetweenContactPairs(previous, current, { shift = false } = {}) {
		const before = normalizeContactPair$1(previous);
		const after = normalizeContactPair$1(current);
		const beforeCentroid = centroid$1(before);
		const afterCentroid = centroid$1(after);
		const beforeVector = subtract$3(before[1], before[0]);
		const afterVector = subtract$3(after[1], after[0]);
		const beforeDistance = Math.hypot(...beforeVector);
		const afterDistance = Math.hypot(...afterVector);
		if (beforeDistance === 0 || afterDistance === 0) return snapshot();
		return applyGesture({
			origin: beforeCentroid,
			translation: subtract$3(afterCentroid, beforeCentroid),
			scale: afterDistance / beforeDistance,
			rotation: Math.atan2(afterVector[1], afterVector[0]) - Math.atan2(beforeVector[1], beforeVector[0])
		}, {
			shift,
			snapRotation: true,
			snapScale: true
		});
	}
	function restore(next) {
		transform = normalizeVkfViewTransform(next?.transform);
		referenceScale = positiveFinite(next?.referenceScale, referenceScale);
		if (next?.viewport) viewport = {
			width: Math.max(1, finite$2(next.viewport.width, viewport.width)),
			height: Math.max(1, finite$2(next.viewport.height, viewport.height))
		};
		initialized = true;
		return snapshot();
	}
	function fit(nextBounds) {
		transform = initialTransform(nextBounds, viewport, minScale, maxScale);
		referenceScale = uniformScale(transform);
		initialized = true;
		return snapshot();
	}
	function snapshot() {
		return Object.freeze({
			transform: normalizeVkfViewTransform(transform),
			referenceScale,
			viewport: Object.freeze({ ...viewport })
		});
	}
	return Object.freeze({
		resize,
		worldToScreen,
		screenToWorld,
		screenBasis,
		grid,
		resolvePlacement,
		zoomAt,
		pan,
		rotate,
		transformBetweenContactPairs,
		fit,
		restore,
		snapshot
	});
}
function snapRotationDelta(rotation, step = ROTATION_SNAP_STEP) {
	const normalizedStep = positiveFinite(step, ROTATION_SNAP_STEP);
	return Math.round(finite$2(rotation, 0) / normalizedStep) * normalizedStep;
}
function snapRelativeScale(relativeScale) {
	const scale = positiveFinite(relativeScale, 1);
	const decade = 10 ** Math.floor(Math.log10(scale));
	const mantissa = scale / decade;
	const step = scale >= 1 ? mantissa < 2 ? decade * .1 : decade * .5 : mantissa < 2 ? decade * .5 : decade;
	return Number((Math.round(scale / step) * step).toPrecision(12));
}
function initialTransform(bounds, viewport, minScale, maxScale) {
	const x = bounds?.x || [-1, 1];
	const y = bounds?.y || [-1, 1];
	const width = Math.max(Number.EPSILON, x[1] - x[0]);
	const height = Math.max(Number.EPSILON, y[1] - y[0]);
	const scale = clamp$1(Math.min(viewport.width / width, viewport.height / height) * .9, minScale, maxScale);
	const center = [(x[0] + x[1]) / 2, (y[0] + y[1]) / 2];
	return normalizeVkfViewTransform({
		position: [viewport.width / 2 - center[0] * scale, viewport.height / 2 + center[1] * scale],
		scale,
		rotation: 0
	});
}
function gridValues(values, range) {
	const visible = Array.isArray(values) ? values.filter((value) => value >= range[0] && value <= range[1]) : [];
	if (range[0] <= 0 && range[1] >= 0 && !visible.some((value) => value === 0)) visible.push(0);
	return visible.sort((a, b) => a - b);
}
function appendGridValues(lines, values, createLine) {
	if (values.length > MAX_GRID_LINES) return;
	for (const value of values) lines.push(createLine(value));
}
function normalizeContactPair$1(pair) {
	if (!Array.isArray(pair) || pair.length !== 2) throw new TypeError("A coordinate gesture requires exactly two contacts.");
	return pair.map((point) => [finite$2(point?.[0], 0), finite$2(point?.[1], 0)]);
}
function centroid$1(pair) {
	return [(pair[0][0] + pair[1][0]) / 2, (pair[0][1] + pair[1][1]) / 2];
}
function subtract$3(a, b) {
	return [a[0] - b[0], a[1] - b[1]];
}
function unitVector(vector) {
	const length = Math.hypot(...vector);
	return length > 0 ? [vector[0] / length, vector[1] / length] : [1, 0];
}
function extent(values) {
	return [Math.min(...values), Math.max(...values)];
}
function uniformScale(transform) {
	return Math.sqrt(Math.abs(transform.scale[0] * transform.scale[1]));
}
function distance(a, b) {
	return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
function nearestRenderedVertex$1(screen, vertices, worldToScreen, vertexRadius) {
	let nearest = null;
	let nearestDistance = Math.max(0, vertexRadius);
	vertices.forEach((world, index) => {
		if (!Array.isArray(world) || world.length < 2) return;
		const rendered = worldToScreen(world);
		const renderedDistance = distance(rendered, screen);
		if (renderedDistance <= nearestDistance) {
			nearest = {
				index,
				world: [...world],
				screen: rendered
			};
			nearestDistance = renderedDistance;
		}
	});
	return nearest;
}
function nearlyZero(value, interval) {
	return Math.abs(value) <= interval * 1e-9;
}
function clamp$1(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}
function finite$2(value, fallback) {
	return Number.isFinite(value) ? value : fallback;
}
function positiveFinite(value, fallback) {
	return Number.isFinite(value) && value > 0 ? value : fallback;
}
//#endregion
//#region ../../../Tesseracs/products.platonic-play.web/node_modules/vektor-flow/web/vf-ui/vf-axis3d-kernel.js
var require_vf_axis3d_kernel = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof module === "object" && module.exports) {
			module.exports = factory();
			return;
		}
		root.VfAxis3DKernel = factory();
	})(typeof globalThis !== "undefined" ? globalThis : exports, function() {
		"use strict";
		function vec3Array(v, fallback) {
			return [
				Number(v && v[0]),
				Number(v && v[1]),
				Number(v && v[2])
			].map(function(n, i) {
				return Number.isFinite(n) ? n : Number((fallback || [
					0,
					0,
					0
				])[i] || 0);
			});
		}
		function dot3(a, b) {
			return (Number(a && a[0]) || 0) * (Number(b && b[0]) || 0) + (Number(a && a[1]) || 0) * (Number(b && b[1]) || 0) + (Number(a && a[2]) || 0) * (Number(b && b[2]) || 0);
		}
		function crossVec3(a, b) {
			var ax = Number(a && a[0]) || 0;
			var ay = Number(a && a[1]) || 0;
			var az = Number(a && a[2]) || 0;
			var bx = Number(b && b[0]) || 0;
			var by = Number(b && b[1]) || 0;
			var bz = Number(b && b[2]) || 0;
			return [
				ay * bz - az * by,
				az * bx - ax * bz,
				ax * by - ay * bx
			];
		}
		function normalizeVec3Local(v, fallback) {
			var x = Number(v && v[0]) || 0;
			var y = Number(v && v[1]) || 0;
			var z = Number(v && v[2]) || 0;
			var len = Math.sqrt(x * x + y * y + z * z);
			if (!(len > 1e-9)) return (fallback || [
				0,
				0,
				1
			]).slice();
			return [
				x / len,
				y / len,
				z / len
			];
		}
		function rotateVec3AroundAxis(v, axis, angleRad) {
			axis = normalizeVec3Local(axis, [
				0,
				0,
				1
			]);
			var c = Math.cos(Number(angleRad) || 0);
			var s = Math.sin(Number(angleRad) || 0);
			var d = dot3(axis, v);
			var cr = crossVec3(axis, v);
			return [
				v[0] * c + cr[0] * s + axis[0] * d * (1 - c),
				v[1] * c + cr[1] * s + axis[1] * d * (1 - c),
				v[2] * c + cr[2] * s + axis[2] * d * (1 - c)
			];
		}
		function axis3DBoxSpan(cfg, axis) {
			var lo = Number(cfg && cfg[axis + "_min"]);
			var hi = Number(cfg && cfg[axis + "_max"]);
			if (!Number.isFinite(lo) || !Number.isFinite(hi)) return 1;
			return Math.max(1e-9, hi - lo);
		}
		function rotationCenter(cfg) {
			if (cfg && String(cfg.mode || "crosshair").toLowerCase() === "box") return [
				((Number(cfg.x_min) || 0) + (Number(cfg.x_max) || 0)) * .5,
				((Number(cfg.y_min) || 0) + (Number(cfg.y_max) || 0)) * .5,
				((Number(cfg.z_min) || 0) + (Number(cfg.z_max) || 0)) * .5
			];
			return [
				0,
				0,
				0
			];
		}
		function preserveTargetOffsetOnRotate(cfg) {
			return String(cfg && cfg.mode || "crosshair").toLowerCase() !== "box";
		}
		function screenBasis(camera, center) {
			var pos = vec3Array(camera && camera.pos, [
				4,
				4,
				5.657
			]);
			var target = vec3Array(camera && camera.target, Array.isArray(center) ? center : [
				0,
				0,
				0
			]);
			var upHint = normalizeVec3Local(camera && camera.up || [
				0,
				0,
				1
			], [
				0,
				0,
				1
			]);
			var forward = normalizeVec3Local([
				target[0] - pos[0],
				target[1] - pos[1],
				target[2] - pos[2]
			], [
				0,
				0,
				-1
			]);
			var right = normalizeVec3Local(crossVec3(forward, upHint), [
				1,
				0,
				0
			]);
			return {
				right,
				up: normalizeVec3Local(crossVec3(right, forward), [
					0,
					0,
					1
				]),
				forward
			};
		}
		function applyWorldRotation(camera, center, worldAxis, angleRad, options) {
			options = options && typeof options === "object" ? options : {};
			var axis = normalizeVec3Local(worldAxis, [
				0,
				0,
				1
			]);
			var pos = vec3Array(camera && camera.pos, [
				4,
				4,
				5.657
			]);
			var pivot = Array.isArray(center) ? center.slice() : [
				0,
				0,
				0
			];
			var target = vec3Array(camera && camera.target, pivot);
			var nextOffset = rotateVec3AroundAxis([
				pos[0] - pivot[0],
				pos[1] - pivot[1],
				pos[2] - pivot[2]
			], axis, angleRad);
			var nextUp = rotateVec3AroundAxis(vec3Array(camera && camera.up, [
				0,
				0,
				1
			]), axis, angleRad);
			camera.pos = [
				pivot[0] + nextOffset[0],
				pivot[1] + nextOffset[1],
				pivot[2] + nextOffset[2]
			];
			if (options.preserveTargetOffset === true) {
				var nextTargetOffset = rotateVec3AroundAxis([
					target[0] - pivot[0],
					target[1] - pivot[1],
					target[2] - pivot[2]
				], axis, angleRad);
				camera.target = [
					pivot[0] + nextTargetOffset[0],
					pivot[1] + nextTargetOffset[1],
					pivot[2] + nextTargetOffset[2]
				];
			} else camera.target = pivot;
			camera.up = normalizeVec3Local(nextUp, [
				0,
				0,
				1
			]);
			return camera;
		}
		function cloneCamera(camera) {
			var out = Object.assign({}, camera || {});
			out.pos = vec3Array(camera && camera.pos, [
				4,
				4,
				5.657
			]);
			out.target = vec3Array(camera && camera.target, [
				0,
				0,
				0
			]);
			out.up = vec3Array(camera && camera.up, [
				0,
				0,
				1
			]);
			return out;
		}
		function alignAxisToViewSnap(camera, cfg, axisIndex, sign) {
			var center = rotationCenter(cfg || {});
			var preserveTargetOffset = preserveTargetOffsetOnRotate(cfg || {});
			var pos = vec3Array(camera && camera.pos, [
				4,
				4,
				5.657
			]);
			var tgt = vec3Array(camera && camera.target, center);
			var forward = normalizeVec3Local([
				tgt[0] - pos[0],
				tgt[1] - pos[1],
				tgt[2] - pos[2]
			], [
				0,
				0,
				-1
			]);
			var basisAxes = [
				[
					1,
					0,
					0
				],
				[
					0,
					1,
					0
				],
				[
					0,
					0,
					1
				]
			];
			var desired = basisAxes[axisIndex] ? basisAxes[axisIndex].slice() : [
				0,
				0,
				1
			];
			var desiredSign = Number(sign) || 1;
			desired = [
				desired[0] * desiredSign,
				desired[1] * desiredSign,
				desired[2] * desiredSign
			];
			var d = Math.max(-1, Math.min(1, dot3(forward, desired)));
			var angle = Math.acos(d);
			if (!(angle > 1e-6)) return false;
			var axis = crossVec3(forward, desired);
			var axisLen = Math.sqrt(dot3(axis, axis));
			if (!(axisLen > 1e-9)) {
				axis = crossVec3(forward, screenBasis(camera, preserveTargetOffset ? null : center).right);
				axisLen = Math.sqrt(dot3(axis, axis));
				if (!(axisLen > 1e-9)) return false;
			}
			applyWorldRotation(camera, center, [
				axis[0] / axisLen,
				axis[1] / axisLen,
				axis[2] / axisLen
			], angle, { preserveTargetOffset });
			return true;
		}
		function snapViewDirectionToNearestAxis(camera, cfg, options) {
			options = options && typeof options === "object" ? options : {};
			var center = rotationCenter(cfg || {});
			var pos = vec3Array(camera && camera.pos, [
				4,
				4,
				5.657
			]);
			var target = vec3Array(camera && camera.target, center);
			var forward = normalizeVec3Local([
				target[0] - pos[0],
				target[1] - pos[1],
				target[2] - pos[2]
			], [
				0,
				0,
				-1
			]);
			var axes = [
				[
					1,
					0,
					0
				],
				[
					0,
					1,
					0
				],
				[
					0,
					0,
					1
				]
			];
			var best = null;
			for (var axisIndex = 0; axisIndex < axes.length; axisIndex += 1) {
				var signedDot = dot3(forward, axes[axisIndex]);
				var candidate = {
					axisIndex,
					sign: signedDot >= 0 ? 1 : -1,
					angleDeg: Math.acos(Math.max(0, Math.min(1, Math.abs(signedDot)))) * (180 / Math.PI)
				};
				if (!best || candidate.angleDeg < best.angleDeg) best = candidate;
			}
			var snapAngleDeg = Math.max(0, Number(options.snapAngleDeg != null ? options.snapAngleDeg : cfg && cfg.axis_direction_snap_angle_deg) || 15);
			if (!best || best.angleDeg > snapAngleDeg) return null;
			alignAxisToViewSnap(camera, cfg || {}, best.axisIndex, best.sign);
			return best;
		}
		function virtualTrackballPoint(rectLike, px, py, marginPx) {
			var w = Math.max(1, Number(rectLike && rectLike.width) || 1);
			var h = Math.max(1, Number(rectLike && rectLike.height) || 1);
			var margin = Math.max(0, Number(marginPx != null ? marginPx : 20) || 0);
			var radius = Math.max(1, Math.min(w, h) * .5 - margin);
			var cx = w * .5;
			var cy = h * .5;
			var x = ((Number(px) || 0) - cx) / radius;
			var y = (cy - (Number(py) || 0)) / radius;
			var r2 = x * x + y * y;
			if (r2 <= 1) return {
				inside: true,
				radius,
				center: [cx, cy],
				point: [
					x,
					y,
					Math.sqrt(Math.max(0, 1 - r2))
				]
			};
			var len = Math.sqrt(r2);
			return {
				inside: false,
				radius,
				center: [cx, cy],
				point: [
					x / len,
					y / len,
					0
				]
			};
		}
		function virtualTrackballRotate(camera, cfg, rectLike, prevPx, prevPy, curPx, curPy, options) {
			options = options && typeof options === "object" ? options : {};
			var prev = virtualTrackballPoint(rectLike, prevPx, prevPy, options.marginPx);
			var cur = virtualTrackballPoint(rectLike, curPx, curPy, options.marginPx);
			var a = prev.point;
			var b = cur.point;
			var dot = Math.max(-1, Math.min(1, dot3(a, b)));
			var angle = Math.acos(dot);
			if (!(angle > 1e-7)) return false;
			var axisView = crossVec3(a, b);
			var axisLen = Math.sqrt(dot3(axisView, axisView));
			if (!(axisLen > 1e-9)) return false;
			axisView = [
				axisView[0] / axisLen,
				axisView[1] / axisLen,
				axisView[2] / axisLen
			];
			var center = rotationCenter(cfg || {});
			var preserveTargetOffset = preserveTargetOffsetOnRotate(cfg || {});
			var basis = screenBasis(camera, preserveTargetOffset ? null : center);
			applyWorldRotation(camera, center, normalizeVec3Local([
				basis.right[0] * axisView[0] + basis.up[0] * axisView[1] + basis.forward[0] * axisView[2],
				basis.right[1] * axisView[0] + basis.up[1] * axisView[1] + basis.forward[1] * axisView[2],
				basis.right[2] * axisView[0] + basis.up[2] * axisView[1] + basis.forward[2] * axisView[2]
			], basis.forward), angle, { preserveTargetOffset });
			return true;
		}
		function dragWorldDelta(camera, width, height, dx, dy) {
			var pos = vec3Array(camera && camera.pos, [
				4,
				4,
				5.657
			]);
			var target = vec3Array(camera && camera.target, [
				0,
				0,
				0
			]);
			var upHint = normalizeVec3Local(camera && camera.up || [
				0,
				0,
				1
			], [
				0,
				0,
				1
			]);
			var backward = normalizeVec3Local([
				pos[0] - target[0],
				pos[1] - target[1],
				pos[2] - target[2]
			], [
				0,
				0,
				1
			]);
			var right = normalizeVec3Local(crossVec3(upHint, backward), [
				1,
				0,
				0
			]);
			var up = normalizeVec3Local(crossVec3(backward, right), [
				0,
				0,
				1
			]);
			var h = Math.max(1, Number(height) || 1);
			var dist = Math.sqrt(dot3([
				pos[0] - target[0],
				pos[1] - target[1],
				pos[2] - target[2]
			], [
				pos[0] - target[0],
				pos[1] - target[1],
				pos[2] - target[2]
			]));
			var isOrtho = String(camera && camera.projection || "").toLowerCase() === "orthographic";
			var fov = (Number(camera && camera.fov) || 45) * Math.PI / 180;
			var worldPerPx = isOrtho ? 2 * Math.max(1e-6, Number(camera && camera.ortho_scale) || 2.5) / h : 2 * dist * Math.tan(fov * .5) / h;
			return [
				(-dx * right[0] + dy * up[0]) * worldPerPx,
				(-dx * right[1] + dy * up[1]) * worldPerPx,
				(-dx * right[2] + dy * up[2]) * worldPerPx
			];
		}
		function boxDragDataDelta(camera, width, height, cfg, dx, dy) {
			var pos = vec3Array(camera && camera.pos, [
				4,
				4,
				5.657
			]);
			var target = vec3Array(camera && camera.target, [
				0,
				0,
				0
			]);
			var upHint = normalizeVec3Local(camera && camera.up || [
				0,
				0,
				1
			], [
				0,
				0,
				1
			]);
			var backward = normalizeVec3Local([
				pos[0] - target[0],
				pos[1] - target[1],
				pos[2] - target[2]
			], [
				0,
				0,
				1
			]);
			var right = normalizeVec3Local(crossVec3(upHint, backward), [
				1,
				0,
				0
			]);
			var up = normalizeVec3Local(crossVec3(backward, right), [
				0,
				0,
				1
			]);
			var pxSpan = Math.max(1, Math.min(Number(width) || 1, Number(height) || 1));
			var unitsPerPx = Math.max(axis3DBoxSpan(cfg, "x"), axis3DBoxSpan(cfg, "y"), axis3DBoxSpan(cfg, "z")) / pxSpan;
			return [
				(-dx * right[0] + dy * up[0]) * unitsPerPx,
				(-dx * right[1] + dy * up[1]) * unitsPerPx,
				(-dx * right[2] + dy * up[2]) * unitsPerPx
			];
		}
		function buildCrosshairHelperLineMesh(spec) {
			spec = spec || {};
			var color = Array.isArray(spec.color) ? spec.color.slice(0, 4) : [
				1,
				1,
				1,
				1
			];
			while (color.length < 4) color.push(color.length === 3 ? 1 : 0);
			function pushVertex(out, x, y, z) {
				out.push(Number(x) || 0, Number(y) || 0, Number(z) || 0, 0, 0, 1, Number(color[0]) || 0, Number(color[1]) || 0, Number(color[2]) || 0, Number(color[3]) || 0);
			}
			function addLine(verts, inds, a, b) {
				var base = verts.length / 10;
				pushVertex(verts, a[0], a[1], a[2]);
				pushVertex(verts, b[0], b[1], b[2]);
				inds.push(base, base + 1);
			}
			var xRange = spec.xRange || {
				lo: 0,
				hi: 0
			};
			var yRange = spec.yRange || {
				lo: 0,
				hi: 0
			};
			var zRange = spec.zRange || {
				lo: 0,
				hi: 0
			};
			var base = spec.base || [
				0,
				0,
				0
			];
			var verts = [];
			var inds = [];
			addLine(verts, inds, [
				Number(xRange.lo) || 0,
				Number(base[1]) || 0,
				Number(base[2]) || 0
			], [
				Number(xRange.hi) || 0,
				Number(base[1]) || 0,
				Number(base[2]) || 0
			]);
			addLine(verts, inds, [
				Number(base[0]) || 0,
				Number(yRange.lo) || 0,
				Number(base[2]) || 0
			], [
				Number(base[0]) || 0,
				Number(yRange.hi) || 0,
				Number(base[2]) || 0
			]);
			addLine(verts, inds, [
				Number(base[0]) || 0,
				Number(base[1]) || 0,
				Number(zRange.lo) || 0
			], [
				Number(base[0]) || 0,
				Number(base[1]) || 0,
				Number(zRange.hi) || 0
			]);
			return {
				vertices: verts,
				indices: inds
			};
		}
		return {
			rotationCenter,
			screenBasis,
			applyWorldRotation,
			preserveTargetOffsetOnRotate,
			cloneCamera,
			alignAxisToViewSnap,
			snapViewDirectionToNearestAxis,
			virtualTrackballPoint,
			virtualTrackballRotate,
			dragWorldDelta,
			boxDragDataDelta,
			buildCrosshairHelperLineMesh
		};
	});
}));
//#endregion
//#region ../../../Tesseracs/products.platonic-play.web/node_modules/vektor-flow/web/vf-ui/vf-axis3d-kernel-adapter.js
var require_vf_axis3d_kernel_adapter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof module === "object" && module.exports) {
			module.exports = factory(require_vf_axis3d_kernel());
			return;
		}
		root.VfAxis3DKernelAdapter = factory(root.VfAxis3DKernel);
	})(typeof globalThis !== "undefined" ? globalThis : exports, function(kernel) {
		"use strict";
		function createJsAxis3DKernelAdapter(overrides) {
			overrides = overrides || {};
			return {
				rotationCenter: overrides.rotationCenter || kernel && kernel.rotationCenter,
				screenBasis: overrides.screenBasis || kernel && kernel.screenBasis,
				applyWorldRotation: overrides.applyWorldRotation || kernel && kernel.applyWorldRotation,
				cloneCamera: overrides.cloneCamera || kernel && kernel.cloneCamera,
				alignAxisToViewSnap: overrides.alignAxisToViewSnap || kernel && kernel.alignAxisToViewSnap,
				snapViewDirectionToNearestAxis: overrides.snapViewDirectionToNearestAxis || kernel && kernel.snapViewDirectionToNearestAxis,
				virtualTrackballPoint: overrides.virtualTrackballPoint || kernel && kernel.virtualTrackballPoint,
				virtualTrackballRotate: overrides.virtualTrackballRotate || kernel && kernel.virtualTrackballRotate,
				dragWorldDelta: overrides.dragWorldDelta || kernel && kernel.dragWorldDelta,
				boxDragDataDelta: overrides.boxDragDataDelta || kernel && kernel.boxDragDataDelta,
				buildCrosshairHelperLineMesh: overrides.buildCrosshairHelperLineMesh || kernel && kernel.buildCrosshairHelperLineMesh
			};
		}
		return { createJsAxis3DKernelAdapter };
	});
}));
//#endregion
//#region ../../../Tesseracs/products.platonic-play.web/node_modules/vektor-flow/web/vf-ui/vf-axis3d-kernel-adapter.mjs
var import_vf_axis3d_kernel = /* @__PURE__ */ __toESM(require_vf_axis3d_kernel(), 1);
var import_vf_axis3d_kernel_adapter = /* @__PURE__ */ __toESM(require_vf_axis3d_kernel_adapter(), 1);
var kernel = import_vf_axis3d_kernel.default ?? globalThis.VfAxis3DKernel;
var axis3dAdapter = import_vf_axis3d_kernel_adapter.default ?? globalThis.VfAxis3DKernelAdapter;
if (!kernel || !axis3dAdapter) throw new Error("VKF axis3d adapter failed to initialize.");
Object.freeze([
	"none",
	"regular",
	"complex"
]);
Object.freeze([
	"lines",
	"points",
	"triangular",
	"polar",
	"none"
]);
var MAX_PRIMITIVES = 500;
Math.PI * 2;
function buildCoordinateCrosshair3dScene(spec = {}) {
	const width = positive(spec.width, 1);
	const height = positive(spec.height, 1);
	const worldToScreen = requiredTransform(spec.worldToScreen, "worldToScreen");
	const interval = positive(spec.interval, 1);
	const tickLength = positive(spec.tickLength, 6);
	const originWorld = freezeWorldPoint(spec.origin || [
		0,
		0,
		0
	]);
	const origin = freezePoint(worldToScreen(originWorld));
	const axes = [];
	const ticks = [];
	const labels = [];
	const axisLabels = [];
	const names = [
		"x",
		"y",
		"z"
	];
	for (let axisIndex = 0; axisIndex < 3; axisIndex += 1) {
		const unitWorld = [...originWorld];
		unitWorld[axisIndex] += 1;
		const direction = subtract$2(freezePoint(worldToScreen(unitWorld)), origin);
		if (!(Math.hypot(...direction) > 1e-9)) continue;
		const clipped = clipInfiniteLineToRect(origin, direction, width, height);
		if (!clipped) continue;
		const axis = names[axisIndex];
		axes.push(Object.freeze({
			from: freezePoint(clipped.from),
			to: freezePoint(clipped.to),
			axis,
			kind: `axis-${axis}`
		}));
		const normal = unit$1([-direction[1], direction[0]]);
		const halfTick = tickLength / 2;
		const minimum = Math.min(clipped.fromParameter, clipped.toParameter);
		const maximum = Math.max(clipped.fromParameter, clipped.toParameter);
		for (const value of multiples$1(minimum, maximum, interval)) {
			if (nearZero(value, interval)) continue;
			const at = offset(origin, direction, value);
			ticks.push(line(offset(at, normal, -halfTick), offset(at, normal, halfTick), `axis-tick-${axis}`));
			if (inside(at, width, height)) labels.push(label(value, interval, axis, at));
		}
		axisLabels.push(Object.freeze({
			latex: axis,
			axis: `axis-${axis}`,
			at: freezePoint(clipped.toParameter >= clipped.fromParameter ? clipped.to : clipped.from)
		}));
	}
	if (inside(origin, width, height)) labels.push(Object.freeze({
		latex: "0",
		value: 0,
		axis: "origin",
		at: origin
	}));
	return Object.freeze({
		axisMode: axes.length ? "regular" : "none",
		axes: Object.freeze(axes),
		ticks: Object.freeze(ticks),
		labels: Object.freeze(labels),
		axisLabels: Object.freeze(axisLabels)
	});
}
function label(value, interval, axis, at) {
	const raw = formatAxisTickLabel(value, interval);
	return Object.freeze({
		latex: stripMathDelimiters(raw),
		value,
		axis,
		at: freezePoint(at)
	});
}
function formatAxisTickLabel(value, step) {
	let normalized = Number(value) || 0;
	const decimals = decimalPlacesForStep(step);
	if (decimals != null) normalized = Math.round(normalized / step) * step;
	if (Math.abs(normalized) < 1e-12) normalized = 0;
	const absolute = Math.abs(normalized);
	if (absolute !== 0 && (absolute < .01 || absolute >= 1e4)) return `$${formatScientificBody(normalized)}$`;
	if (decimals != null) {
		if (decimals === 0 || Math.abs(normalized - Math.round(normalized)) < 1e-12) return String(Math.round(normalized)).replace(/^-/, "−");
		return Number(normalized.toFixed(decimals)).toFixed(decimals).replace(/\.?0+$/, "").replace(/^-/, "−");
	}
	return String(Number(normalized.toPrecision(6))).replace(/^-/, "−");
}
function decimalPlacesForStep(step) {
	const normalized = Math.abs(Number(step));
	if (!Number.isFinite(normalized) || normalized <= 0) return null;
	for (let decimals = 0; decimals <= 12; decimals += 1) if (Math.abs(normalized * 10 ** decimals - Math.round(normalized * 10 ** decimals)) < 1e-9) return decimals;
	return null;
}
function formatScientificBody(value) {
	const normalized = Number(value) || 0;
	if (normalized === 0) return "0";
	const sign = normalized < 0 ? "-" : "";
	const exponent = Math.floor(Math.log10(Math.abs(normalized)));
	const mantissa = Number((Math.abs(normalized) / 10 ** exponent).toPrecision(6));
	return Math.abs(mantissa - 1) < 1e-8 ? `${sign}10^{${exponent}}` : `${sign}${mantissa} \\cdot 10^{${exponent}}`;
}
function stripMathDelimiters(value) {
	const text = String(value ?? "");
	return text.startsWith("$") && text.endsWith("$") ? text.slice(1, -1) : text;
}
function clipInfiniteLineToRect(origin, direction, width, height) {
	const candidates = [];
	const append = (parameter, x, y) => {
		if (!Number.isFinite(parameter) || x < -1e-9 || x > width + 1e-9 || y < -1e-9 || y > height + 1e-9) return;
		if (candidates.some(({ point }) => Math.hypot(point[0] - x, point[1] - y) < 1e-8)) return;
		candidates.push({
			parameter,
			point: [clampEdge(x, width), clampEdge(y, height)]
		});
	};
	if (Math.abs(direction[0]) > 1e-12) for (const x of [0, width]) {
		const parameter = (x - origin[0]) / direction[0];
		append(parameter, x, origin[1] + parameter * direction[1]);
	}
	if (Math.abs(direction[1]) > 1e-12) for (const y of [0, height]) {
		const parameter = (y - origin[1]) / direction[1];
		append(parameter, origin[0] + parameter * direction[0], y);
	}
	if (candidates.length < 2) return null;
	candidates.sort((left, right) => left.parameter - right.parameter);
	const from = candidates[0];
	const to = candidates.at(-1);
	return {
		from: from.point,
		to: to.point,
		fromParameter: from.parameter,
		toParameter: to.parameter
	};
}
function multiples$1(minimum, maximum, interval) {
	const values = [];
	const start = Math.ceil(minimum / interval) * interval;
	for (let value = start; value <= maximum + interval * 1e-9 && values.length < MAX_PRIMITIVES; value += interval) values.push(Number(value.toPrecision(12)));
	return values;
}
function line(from, to, kind) {
	return Object.freeze({
		from: freezePoint(from),
		to: freezePoint(to),
		kind
	});
}
function freezePoint(point) {
	return Object.freeze([Number(point[0]), Number(point[1])]);
}
function freezeWorldPoint(point) {
	return Object.freeze([
		0,
		1,
		2
	].map((index) => Number(point?.[index]) || 0));
}
function clampEdge(value, maximum) {
	if (Math.abs(value) < 1e-9) return 0;
	if (Math.abs(value - maximum) < 1e-9) return maximum;
	return value;
}
function subtract$2(a, b) {
	return [a[0] - b[0], a[1] - b[1]];
}
function unit$1(vector) {
	const length = Math.hypot(...vector);
	return length > 0 ? [vector[0] / length, vector[1] / length] : [1, 0];
}
function offset(point, direction, distance) {
	return [point[0] + direction[0] * distance, point[1] + direction[1] * distance];
}
function nearZero(value, interval) {
	return Math.abs(value) <= interval * 1e-9;
}
function inside([x, y], width, height) {
	return x >= 0 && x <= width && y >= 0 && y <= height;
}
function positive(value, fallback) {
	return Number.isFinite(value) && value > 0 ? value : fallback;
}
function requiredTransform(value, name) {
	if (typeof value !== "function") throw new TypeError(`${name} must be a function.`);
	return value;
}
//#endregion
//#region ../../../Tesseracs/products.platonic-play.web/node_modules/vektor-flow/web/vf-ui/vf-spatial-geometry.mjs
var EPSILON = 1e-8;
function nearestSpatialPointToLine(points, { linePoint, lineDirection, cameraForward = lineDirection } = {}) {
	const candidates = requirePoints(points, 1);
	const origin = vec3$1(linePoint);
	const direction = normalize(lineDirection);
	const forward = normalize(cameraForward);
	const nearest = candidates.map((point, index) => {
		const delta = subtract$1(point, origin);
		const lineParameter = dot$1(delta, direction);
		return {
			index,
			point,
			distance: magnitude(subtract$1(point, add$1(origin, scale$1(direction, lineParameter)))),
			lineParameter,
			visualDepth: dot$1(delta, forward)
		};
	}).sort((left, right) => {
		const distanceDelta = left.distance - right.distance;
		return Math.abs(distanceDelta) > EPSILON ? distanceDelta : left.visualDepth - right.visualDepth || left.index - right.index;
	})[0];
	return Object.freeze({
		index: nearest.index,
		point: Object.freeze([...nearest.point]),
		distance: nearest.distance,
		lineParameter: nearest.lineParameter
	});
}
function finitePoint(point) {
	return Array.isArray(point) && point.length >= 3 && point.slice(0, 3).every(Number.isFinite);
}
function requirePoints(points, minimum) {
	if (!Array.isArray(points) || points.length < minimum || !points.every(finitePoint)) throw new TypeError("Spatial geometry requires finite 3D points.");
	return points.map(vec3$1);
}
function vec3$1(value) {
	return [
		0,
		1,
		2
	].map((axis) => finite$1(value?.[axis] ?? 0, "3D coordinate"));
}
function add$1(a, b) {
	return [
		a[0] + b[0],
		a[1] + b[1],
		a[2] + b[2]
	];
}
function subtract$1(a, b) {
	return [
		a[0] - b[0],
		a[1] - b[1],
		a[2] - b[2]
	];
}
function scale$1(v, s) {
	return v.map((value) => value * s);
}
function dot$1(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function magnitude(v) {
	return Math.hypot(...v);
}
function normalize(v) {
	const value = vec3$1(v);
	const size = magnitude(value);
	if (size <= EPSILON) throw new RangeError("Spatial direction must be non-zero.");
	return scale$1(value, 1 / size);
}
function finite$1(value, label) {
	const number = Number(value);
	if (!Number.isFinite(number)) throw new TypeError(`${label} must be finite.`);
	return number;
}
//#endregion
//#region browser-ui/vf-coordinate-view-3d.mjs
var DEFAULT_VERTEX_RADIUS = 7;
var DEFAULT_GRID_SPACING = 72;
var AXIS_VIEW_SNAP_ANGLE_DEG = 15;
var MIN_ORTHO_SCALE = .05;
var MAX_ORTHO_SCALE = 1e4;
var { createJsAxis3DKernelAdapter } = axis3dAdapter;
var vkfAxis3d = createJsAxis3DKernelAdapter();
function createCoordinateView3d({ bounds, gridSpacing = DEFAULT_GRID_SPACING } = {}) {
	let viewport = {
		width: 1,
		height: 1
	};
	let camera = initialCamera(bounds);
	let initialized = false;
	function resize(width, height) {
		viewport = {
			width: Math.max(1, finite(width, 1)),
			height: Math.max(1, finite(height, 1))
		};
		initialized = true;
		return snapshot();
	}
	function worldToScreen(world) {
		const point = vec3(world);
		const basis = vkfAxis3d.screenBasis(camera, camera.target);
		const relative = subtract3(point, camera.target);
		const pixelsPerUnit = viewport.height / (2 * camera.ortho_scale);
		return [viewport.width / 2 + dot3(relative, basis.right) * pixelsPerUnit, viewport.height / 2 - dot3(relative, basis.up) * pixelsPerUnit];
	}
	function screenToWorld(screen, options = {}) {
		const basis = vkfAxis3d.screenBasis(camera, camera.target);
		const pixelsPerUnit = viewport.height / (2 * camera.ortho_scale);
		const planePoint = vec3(options.planePoint, camera.target);
		const base = add3(camera.target, add3(scale3(basis.right, (finite(screen?.[0], viewport.width / 2) - viewport.width / 2) / pixelsPerUnit), scale3(basis.up, -(finite(screen?.[1], viewport.height / 2) - viewport.height / 2) / pixelsPerUnit)));
		return add3(base, scale3(basis.forward, dot3(subtract3(planePoint, base), basis.forward)));
	}
	function screenBasis(world) {
		const origin = worldToScreen(world);
		return Object.freeze({
			x: Object.freeze(unit2(subtract2(worldToScreen(add3(vec3(world), [
				1,
				0,
				0
			])), origin))),
			y: Object.freeze(unit2(subtract2(worldToScreen(add3(vec3(world), [
				0,
				1,
				0
			])), origin))),
			z: Object.freeze(unit2(subtract2(worldToScreen(add3(vec3(world), [
				0,
				0,
				1
			])), origin)))
		});
	}
	function screenLine(screen) {
		const basis = vkfAxis3d.screenBasis(camera, camera.target);
		return Object.freeze({
			point: Object.freeze(screenToWorld(screen, { planePoint: camera.target })),
			direction: Object.freeze([...basis.forward])
		});
	}
	function grid() {
		const interval = niceInterval(gridSpacing * 2 * camera.ortho_scale / viewport.height);
		return Object.freeze({
			interval,
			xInterval: interval,
			yInterval: interval,
			zInterval: interval,
			lines: Object.freeze([])
		});
	}
	function resolvePlacement(screen, { shift = false, vertexRadius = DEFAULT_VERTEX_RADIUS, vertices = [], planePoint = camera.target, gridScene = null, gridScreenToWorld = (point) => screenToWorld(point, { planePoint }) } = {}) {
		if (shift) if (gridScene) {
			const candidate = nearestVisibleGridSnap(gridScene, screen);
			if (candidate) return Object.freeze({
				world: Object.freeze(candidate.world || gridScreenToWorld(candidate.at)),
				snap: "intersection",
				targetPoint: null,
				screenTarget: candidate.at
			});
		} else {
			const interval = grid().interval;
			const visible = crosshairGridPoints(worldToScreen, interval, gridRadius(interval, camera.ortho_scale)).filter(({ at }) => insideViewport(at, viewport));
			const line = screenLine(screen);
			const nearestResult = visible.length ? nearestSpatialPointToLine(visible.map(({ world }) => world), {
				linePoint: line.point,
				lineDirection: line.direction,
				cameraForward: line.direction
			}) : null;
			const nearest = nearestResult ? visible[nearestResult.index] : null;
			if (nearest) return Object.freeze({
				world: nearest.world,
				snap: "intersection",
				targetPoint: null,
				screenTarget: nearest.at
			});
		}
		const vertex = nearestRenderedVertex(screen, vertices, worldToScreen, vertexRadius, camera);
		if (vertex) return Object.freeze({
			world: vertex.world,
			snap: "vertex",
			targetPoint: vertex.index,
			screenTarget: vertex.screen
		});
		const world = screenToWorld(screen, { planePoint });
		if (!shift) return Object.freeze({
			world: Object.freeze(world),
			snap: "none",
			targetPoint: null,
			screenTarget: Object.freeze([...screen])
		});
		return Object.freeze({
			world: Object.freeze(world),
			snap: "none",
			targetPoint: null,
			screenTarget: Object.freeze([...screen])
		});
	}
	function zoomAt(_screen, wheelDelta) {
		camera.ortho_scale = clamp(camera.ortho_scale * Math.exp(finite(wheelDelta, 0) * .0015), MIN_ORTHO_SCALE, MAX_ORTHO_SCALE);
		return snapshot();
	}
	function pan(previous, current) {
		const delta = vkfAxis3d.dragWorldDelta(camera, viewport.width, viewport.height, finite(current?.[0], 0) - finite(previous?.[0], 0), finite(current?.[1], 0) - finite(previous?.[1], 0));
		camera.pos = add3(camera.pos, delta);
		camera.target = add3(camera.target, delta);
		return snapshot();
	}
	function rotate(previous, current) {
		vkfAxis3d.virtualTrackballRotate(camera, { mode: "crosshair" }, viewport, finite(previous?.[0], 0), finite(previous?.[1], 0), finite(current?.[0], 0), finite(current?.[1], 0));
		vkfAxis3d.snapViewDirectionToNearestAxis(camera, { mode: "crosshair" }, { snapAngleDeg: AXIS_VIEW_SNAP_ANGLE_DEG });
		return snapshot();
	}
	function transformBetweenContactPairs(previous, current) {
		const before = normalizeContactPair(previous);
		const after = normalizeContactPair(current);
		const beforeCenter = centroid(before);
		const afterCenter = centroid(after);
		const beforeDistance = distance2(before[0], before[1]);
		const afterDistance = distance2(after[0], after[1]);
		pan(beforeCenter, afterCenter);
		if (beforeDistance > 0 && afterDistance > 0) camera.ortho_scale = clamp(camera.ortho_scale * beforeDistance / afterDistance, MIN_ORTHO_SCALE, MAX_ORTHO_SCALE);
		return snapshot();
	}
	function rotateBetweenContactPairs(previous, current) {
		return rotate(centroid(normalizeContactPair(previous)), centroid(normalizeContactPair(current)));
	}
	function restore(next) {
		if (next?.kind !== "coordinate-view-3d") return snapshot();
		camera = normalizeCamera(next.camera, camera);
		if (next.viewport) resize(next.viewport.width, next.viewport.height);
		initialized = true;
		return snapshot();
	}
	function snapshot() {
		return Object.freeze({
			kind: "coordinate-view-3d",
			camera: freezeCamera(camera),
			viewport: Object.freeze({ ...viewport }),
			initialized
		});
	}
	function focusPoint() {
		return Object.freeze([...camera.target]);
	}
	function fitPoints(points, { padding = 1.18 } = {}) {
		const valid = (Array.isArray(points) ? points : []).map((point) => vec3(point)).filter((point) => point.every(Number.isFinite));
		if (!valid.length) return snapshot();
		const minimum = [
			0,
			1,
			2
		].map((axis) => Math.min(...valid.map((point) => point[axis])));
		const maximum = [
			0,
			1,
			2
		].map((axis) => Math.max(...valid.map((point) => point[axis])));
		const target = minimum.map((value, axis) => (value + maximum[axis]) / 2);
		const basis = vkfAxis3d.screenBasis(camera, target);
		const projected = valid.map((point) => {
			const relative = subtract3(point, target);
			return [dot3(relative, basis.right), dot3(relative, basis.up)];
		});
		const halfWidth = Math.max(1e-6, ...projected.map(([x]) => Math.abs(x)));
		const halfHeight = Math.max(1e-6, ...projected.map(([, y]) => Math.abs(y)));
		const aspect = viewport.width / Math.max(1, viewport.height);
		const translation = subtract3(target, camera.target);
		camera.pos = add3(camera.pos, translation);
		camera.target = target;
		camera.ortho_scale = clamp(Math.max(halfHeight, halfWidth / aspect) * padding, MIN_ORTHO_SCALE, MAX_ORTHO_SCALE);
		return snapshot();
	}
	return Object.freeze({
		resize,
		worldToScreen,
		screenToWorld,
		screenBasis,
		screenLine,
		grid,
		resolvePlacement,
		zoomAt,
		pan,
		rotate,
		transformBetweenContactPairs,
		rotateBetweenContactPairs,
		restore,
		snapshot,
		focusPoint,
		fitPoints
	});
}
function buildCrosshair3dScene(view, { gridVisible = true, axisVisible = true, extent = null } = {}) {
	const interval = view.grid().interval;
	const snapshot = view.snapshot();
	const cameraScale = snapshot.camera.ortho_scale;
	const radius = extent || gridRadius(interval, cameraScale);
	const points = gridVisible ? crosshairGridPoints(view.worldToScreen, interval, radius) : [];
	const crosshair = axisVisible ? buildCoordinateCrosshair3dScene({
		width: snapshot.viewport.width,
		height: snapshot.viewport.height,
		interval,
		worldToScreen: view.worldToScreen
	}) : {
		axes: [],
		ticks: [],
		labels: [],
		axisLabels: []
	};
	return Object.freeze({
		mode: "points",
		axisMode: axisVisible ? "regular" : "none",
		lines: Object.freeze([]),
		points: Object.freeze(points),
		circles: Object.freeze([]),
		axes: crosshair.axes,
		ticks: crosshair.ticks,
		labels: crosshair.labels,
		axisLabels: crosshair.axisLabels
	});
}
function crosshairGridPoints(worldToScreen, interval, radius) {
	const values = multiples(-radius, radius, interval);
	const points = [];
	const seen = /* @__PURE__ */ new Set();
	for (const plane of [
		"xy",
		"xz",
		"yz"
	]) {
		const append = (first, second) => {
			const world = plane === "xy" ? [
				first,
				second,
				0
			] : plane === "xz" ? [
				first,
				0,
				second
			] : [
				0,
				first,
				second
			];
			const key = world.map((value) => Number(value.toPrecision(10))).join(":");
			if (seen.has(key)) return;
			seen.add(key);
			points.push(Object.freeze({
				at: Object.freeze(worldToScreen(world)),
				world: Object.freeze(world),
				kind: "grid-point"
			}));
		};
		for (const first of values) for (const second of values) append(first, second);
	}
	return Object.freeze(points);
}
function gridRadius(interval, cameraScale) {
	return Math.max(interval, Math.ceil(cameraScale * 1.5 / interval) * interval);
}
function insideViewport([x, y], viewport) {
	return x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height;
}
function initialCamera(bounds = {}) {
	const xSpan = span(bounds.x, 12);
	const ySpan = span(bounds.y, 8);
	const zSpan = span(bounds.z, Math.min(xSpan, ySpan));
	return {
		pos: [
			7,
			7,
			7
		],
		target: [
			0,
			0,
			0
		],
		up: [
			0,
			0,
			1
		],
		projection: "orthographic",
		fov: 45,
		ortho_scale: Math.max(xSpan, ySpan, zSpan) * .55
	};
}
function normalizeCamera(value, fallback) {
	return {
		...fallback,
		...value || {},
		pos: vec3(value?.pos, fallback.pos),
		target: vec3(value?.target, fallback.target),
		up: vec3(value?.up, fallback.up),
		projection: "orthographic",
		ortho_scale: clamp(finite(value?.ortho_scale, fallback.ortho_scale), MIN_ORTHO_SCALE, MAX_ORTHO_SCALE)
	};
}
function freezeCamera(camera) {
	return Object.freeze({
		...camera,
		pos: Object.freeze([...camera.pos]),
		target: Object.freeze([...camera.target]),
		up: Object.freeze([...camera.up])
	});
}
function nearestRenderedVertex(screen, vertices, project, radius, camera) {
	const basis = vkfAxis3d.screenBasis(camera, camera.target);
	return vertices.map((world, index) => ({
		index,
		world: Object.freeze(vec3(world)),
		screen: Object.freeze(project(world)),
		depth: dot3(subtract3(vec3(world), camera.pos), basis.forward)
	})).map((candidate) => ({
		...candidate,
		distance: distance2(candidate.screen, screen)
	})).filter(({ distance }) => distance <= radius).sort((left, right) => left.distance - right.distance || left.depth - right.depth)[0] || null;
}
function normalizeContactPair(value) {
	if (!Array.isArray(value) || value.length !== 2) throw new TypeError("A 3D coordinate gesture requires exactly two contacts.");
	return value.map((point) => [finite(point?.[0], 0), finite(point?.[1], 0)]);
}
function centroid(pair) {
	return [(pair[0][0] + pair[1][0]) / 2, (pair[0][1] + pair[1][1]) / 2];
}
function multiples(minimum, maximum, interval) {
	const result = [];
	for (let value = minimum; value <= maximum + interval * 1e-9; value += interval) result.push(Number(value.toPrecision(12)));
	return result;
}
function niceInterval(value) {
	const normalized = Math.max(1e-12, finite(value, 1));
	const magnitude = 10 ** Math.floor(Math.log10(normalized));
	const fraction = normalized / magnitude;
	return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * magnitude;
}
function span(value, fallback) {
	return Array.isArray(value) && value.length >= 2 ? Math.max(1e-9, finite(value[1], fallback) - finite(value[0], 0)) : fallback;
}
function vec3(value, fallback = [
	0,
	0,
	0
]) {
	return [
		0,
		1,
		2
	].map((index) => finite(value?.[index], fallback[index] || 0));
}
function add3(left, right) {
	return [
		left[0] + right[0],
		left[1] + right[1],
		left[2] + right[2]
	];
}
function subtract3(left, right) {
	return [
		left[0] - right[0],
		left[1] - right[1],
		left[2] - right[2]
	];
}
function scale3(value, scale) {
	return [
		value[0] * scale,
		value[1] * scale,
		value[2] * scale
	];
}
function dot3(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}
function subtract2(left, right) {
	return [left[0] - right[0], left[1] - right[1]];
}
function unit2(value) {
	const length = Math.hypot(value[0], value[1]);
	return length > 1e-9 ? [value[0] / length, value[1] / length] : [1, 0];
}
function distance2(left, right) {
	return Math.hypot(left[0] - right[0], left[1] - right[1]);
}
function finite(value, fallback) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}
function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}
//#endregion
//#region browser-ui/vf-geometry-render-size.mjs
var DEFAULT_VERTEX_RADIUS_PX = 7;
var DEFAULT_EDGE_WIDTH_PX = 2;
function vertexScreenRadius(properties = {}, projection = {}) {
	return screenSize({
		pixelValue: properties.vertexPxRadius,
		dataValue: properties.vertexRadius,
		fallbackPixels: DEFAULT_VERTEX_RADIUS_PX,
		...projection
	});
}
function edgeScreenWidth(properties = {}, projection = {}) {
	return screenSize({
		pixelValue: properties.edgePxWidth,
		dataValue: properties.edgeWidth,
		fallbackPixels: DEFAULT_EDGE_WIDTH_PX,
		...projection
	});
}
function vertexRenderPresentation(properties = {}, spatialDimension = 2) {
	return geometryRenderPresentation({
		spatialDimension,
		pixelValue: properties.vertexPxRadius,
		dataValue: properties.vertexRadius,
		flatShape: "disk",
		spatialShape: "sphere"
	});
}
function edgeRenderPresentation(properties = {}, spatialDimension = 2) {
	return geometryRenderPresentation({
		spatialDimension,
		pixelValue: properties.edgePxWidth,
		dataValue: properties.edgeWidth,
		flatShape: "line",
		spatialShape: "tube"
	});
}
function geometryRenderPresentation({ spatialDimension, pixelValue, dataValue, flatShape, spatialShape }) {
	if (Number(spatialDimension) < 3) return {
		shape: flatShape,
		renderMode: "screen_geometry",
		sizeSpace: "pixel"
	};
	return {
		shape: spatialShape,
		renderMode: "marker_impostor",
		sizeSpace: Number.isFinite(pixelValue) || !Number.isFinite(dataValue) ? "pixel" : "world"
	};
}
function screenSize({ pixelValue, dataValue, fallbackPixels, pixelRatio = 1, dataLengthToPixels = () => 0 }) {
	if (Number.isFinite(pixelValue)) return Math.max(0, pixelValue) * pixelRatio;
	if (Number.isFinite(dataValue)) return Math.max(0, dataLengthToPixels(dataValue));
	return fallbackPixels * pixelRatio;
}
//#endregion
//#region browser-ui/vf-retained-scene-arena.mjs
function materializeRetainedSceneArena(packet) {
	const schema = "vektor-flow/retained-scene-arena";
	if (packet?.schema !== schema || packet.version !== 1 || packet.metadata?.schema !== schema || packet.metadata.version !== 1) throw new TypeError("unsupported retained scene arena schema");
	if (!(packet.arena instanceof Uint8Array)) throw new TypeError("retained arena bytes must be Uint8Array");
	const source = packet.metadata.scene;
	if (!source || typeof source.frame !== "string" || !source.frame) throw new TypeError("retained arena requires a Frame identity");
	const scene = { ...source };
	for (const collection of ["meshes", "surfaces"]) {
		if (source[collection] == null) continue;
		if (!Array.isArray(source[collection])) throw new TypeError("retained geometry collection must be an array");
		scene[collection] = source[collection].map((geometry) => ({
			...geometry,
			vertices: view(geometry.vertices, packet.arena, "float32"),
			indices: view(geometry.indices, packet.arena, "uint32")
		}));
	}
	return scene;
}
function view(reference, arena, storage) {
	if (!reference || reference.storage !== storage) throw new TypeError("unsupported retained arena storage");
	const offset = reference.byte_offset, length = reference.length;
	if (!Number.isSafeInteger(offset) || offset < 0 || offset % 4 || !Number.isSafeInteger(length) || length < 0 || offset + length * 4 > arena.byteLength) throw new RangeError("invalid retained arena range");
	const absolute = arena.byteOffset + offset;
	if (absolute % 4) throw new RangeError("retained arena view is not aligned");
	return storage === "float32" ? new Float32Array(arena.buffer, absolute, length) : new Uint32Array(arena.buffer, absolute, length);
}
//#endregion
//#region browser-ui/vf-retained-plot-view.mjs
function createRetainedPlotView({ coordinates, renderer, pixelRatio = globalThis.devicePixelRatio || 1, selectionColor = "#00ffff", selectionRadius = 4, ringWidth = 2 } = {}) {
	if (typeof coordinates?.worldToScreen !== "function") throw new TypeError("coordinates must project world positions");
	if (!(Number.isFinite(pixelRatio) && pixelRatio > 0)) throw new RangeError("pixelRatio must be positive");
	const scene = createRetainedGeometryScene();
	let frame = null;
	let meshes = [];
	let selected = /* @__PURE__ */ new Set();
	function replace(next) {
		if (!next || typeof next.frame !== "string" || !Array.isArray(next.meshes)) throw new TypeError("retained scene requires a frame and meshes");
		const ids = /* @__PURE__ */ new Set();
		const values = next.meshes.filter((mesh) => mesh.visible !== false).map((mesh) => {
			if (mesh.type !== "field_mesh") throw new TypeError("only compiler field_mesh geometry is supported");
			if (typeof mesh.id !== "string" || !mesh.id || ids.has(mesh.id)) throw new TypeError("mesh ids must be unique");
			ids.add(mesh.id);
			const vertices = mesh.vertices;
			if (!Array.isArray(vertices) && !(vertices instanceof Float32Array) || vertices.length % 10 || !Array.from(vertices).every(Number.isFinite)) throw new TypeError("compiler vertices require finite position/normal/color records");
			const points = Array.from({ length: vertices.length / 10 }, (_, index) => Array.from(vertices.slice(index * 10, index * 10 + 3)));
			const colors = points.map((_, index) => Array.from(vertices.slice(index * 10 + 6, index * 10 + 10)));
			const topology = mesh.topology;
			const indices = Array.from(mesh.indices || []);
			if (![
				"line-list",
				"line-strip",
				"triangle-list",
				"point-list"
			].includes(topology)) throw new TypeError("unsupported compiler topology");
			if (indices.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= points.length)) throw new RangeError("compiler index is outside vertex storage");
			if (topology === "line-list" && indices.length % 2 || topology === "triangle-list" && indices.length % 3) throw new RangeError("incomplete compiler primitive indices");
			for (const name of ["selectable", "draggable"]) if (name in mesh && typeof mesh[name] !== "boolean") throw new TypeError(`mesh ${name} must be a boolean`);
			return {
				id: mesh.id,
				pickable: mesh.pickable !== false,
				selectable: mesh.selectable !== false,
				draggable: mesh.draggable === true,
				points,
				colors,
				indices,
				topology,
				sizeSpace: mesh.marker_space || "pixel",
				width: mesh.edge_width ?? 2,
				radius: (mesh.vertex_size ?? mesh.point_size ?? 14) / 2
			};
		});
		if (frame !== next.frame) selected = /* @__PURE__ */ new Set();
		frame = next.frame;
		meshes = values;
		selected = new Set([...selected].filter((id) => values.some((mesh) => mesh.id === id && mesh.pickable && mesh.selectable)));
	}
	function projected(mesh) {
		return mesh.points.map((point) => coordinates.worldToScreen(point).map((value) => value * pixelRatio));
	}
	function pixelSize(mesh, size) {
		if (mesh.sizeSpace !== "world") return size * pixelRatio;
		const state = coordinates.snapshot?.();
		const scale = state?.transform?.scale;
		const pixelsPerUnit = scale ? Math.sqrt(Math.abs(scale[0] * scale[1])) : state?.camera?.ortho_scale ? state.viewport.height / (2 * state.camera.ortho_scale) : null;
		if (!(Number.isFinite(pixelsPerUnit) && pixelsPerUnit > 0)) throw new TypeError("world marker size requires a supported coordinate view");
		return size * pixelsPerUnit * pixelRatio;
	}
	function segments(mesh) {
		const result = [];
		const indices = mesh.indices;
		if (mesh.topology === "line-list") for (let i = 0; i < indices.length; i += 2) result.push([indices[i], indices[i + 1]]);
		if (mesh.topology === "line-strip") for (let i = 1; i < indices.length; i++) result.push([indices[i - 1], indices[i]]);
		return result;
	}
	function render() {
		scene.beginFrame();
		for (const mesh of meshes) {
			const points = projected(mesh);
			for (const [index, [from, to]] of segments(mesh).entries()) {
				const path = [points[from], points[to]];
				scene.path(frame, `${mesh.id}:${index}`, path, pixelSize(mesh, mesh.width), [{
					offset: 0,
					color: mesh.colors[from]
				}, {
					offset: 1,
					color: mesh.colors[to]
				}]);
			}
			if (mesh.topology === "triangle-list") for (let i = 0; i < mesh.indices.length; i += 3) {
				const indices = mesh.indices.slice(i, i + 3);
				const triangle = indices.map((index) => points[index]);
				scene.primitive(frame, `${mesh.id}:${i}`, {
					kind: "face",
					points: triangle,
					colors: indices.map((index) => mesh.colors[index])
				});
			}
			if (mesh.topology === "point-list") for (const index of mesh.indices) {
				scene.primitive(frame, `${mesh.id}:${index}`, {
					kind: "vertex",
					center: points[index],
					radius: pixelSize(mesh, mesh.radius),
					color: mesh.colors[index]
				});
				if (selected.has(mesh.id)) scene.ring(frame, `${mesh.id}:${index}:selected`, points[index], pixelSize(mesh, mesh.radius) + selectionRadius * pixelRatio, ringWidth * pixelRatio, selectionColor, { selection: true });
			}
			if (selected.has(mesh.id)) for (const [index, path] of contourPaths(mesh, segments(mesh)).entries()) scene.selectionContour(frame, `${mesh.id}:outline:${index}`, path.map((vertex) => points[vertex]), selectionColor, pixelRatio, {
				selectionRadius,
				ringWidth
			});
		}
		return scene.commit(renderer);
	}
	function hitTest(point, { tolerance = 7, capability = "selectable" } = {}) {
		if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite) || !Number.isFinite(tolerance) || tolerance < 0) throw new TypeError("selection needs a finite screen point and nonnegative tolerance");
		if (!["selectable", "draggable"].includes(capability)) throw new TypeError("hit capability must be selectable or draggable");
		const screen = point.map((value) => value * pixelRatio);
		let hit = null;
		let best = tolerance * pixelRatio;
		for (const mesh of meshes) {
			if (!mesh.pickable || !mesh[capability]) continue;
			const points = projected(mesh);
			const distances = segments(mesh).map(([from, to]) => distanceToSegment(screen, points[from], points[to]));
			if (mesh.topology === "point-list") distances.push(...mesh.indices.map((index) => Math.max(0, Math.hypot(screen[0] - points[index][0], screen[1] - points[index][1]) - pixelSize(mesh, mesh.radius))));
			if (mesh.topology === "triangle-list") for (let i = 0; i < mesh.indices.length; i += 3) {
				const triangle = mesh.indices.slice(i, i + 3).map((index) => points[index]);
				distances.push(insideTriangle(screen, triangle) ? 0 : Math.min(...triangle.map((from, index) => distanceToSegment(screen, from, triangle[(index + 1) % 3]))));
			}
			const distance = Math.min(...distances);
			if (distance <= best) {
				hit = mesh;
				best = distance;
			}
		}
		return hit ? Object.freeze({
			id: hit.id,
			selectable: hit.selectable,
			draggable: hit.draggable
		}) : null;
	}
	function selectAt(point, { tolerance = 7, additive = false } = {}) {
		const hit = hitTest(point, {
			tolerance,
			capability: "selectable"
		});
		if (!additive) selected.clear();
		if (hit) selected.add(hit.id);
		return selection();
	}
	function selection() {
		return Object.freeze([...selected]);
	}
	function clearSelection() {
		selected.clear();
	}
	return Object.freeze({
		replace,
		replaceArena: (packet) => replace(materializeRetainedSceneArena(packet)),
		render,
		hitTest,
		selectAt,
		selection,
		clearSelection,
		invalidate: scene.invalidate
	});
}
function distanceToSegment(point, from, to) {
	const dx = to[0] - from[0], dy = to[1] - from[1];
	const length = dx * dx + dy * dy;
	const t = length ? Math.max(0, Math.min(1, ((point[0] - from[0]) * dx + (point[1] - from[1]) * dy) / length)) : 0;
	return Math.hypot(point[0] - from[0] - t * dx, point[1] - from[1] - t * dy);
}
function insideTriangle(point, triangle) {
	const signs = triangle.map((a, index) => {
		const b = triangle[(index + 1) % 3];
		return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
	});
	return signs.some((value) => value > 0) && !signs.some((value) => value < 0) || signs.some((value) => value < 0) && !signs.some((value) => value > 0);
}
function contourPaths(mesh, lineSegments) {
	const edges = /* @__PURE__ */ new Map();
	function append(from, to) {
		const key = from < to ? `${from}:${to}` : `${to}:${from}`;
		const entry = edges.get(key);
		if (entry) entry.count++;
		else edges.set(key, {
			from,
			to,
			count: 1
		});
	}
	if (mesh.topology === "triangle-list") {
		for (let i = 0; i < mesh.indices.length; i += 3) {
			const [a, b, c] = mesh.indices.slice(i, i + 3);
			append(a, b);
			append(b, c);
			append(c, a);
		}
		for (const [key, entry] of edges) if (entry.count !== 1) edges.delete(key);
	} else for (const [from, to] of lineSegments) append(from, to);
	const adjacency = /* @__PURE__ */ new Map();
	for (const [key, { from, to }] of edges) for (const vertex of [from, to]) {
		if (!adjacency.has(vertex)) adjacency.set(vertex, []);
		adjacency.get(vertex).push(key);
	}
	const remaining = new Set(edges.keys());
	const paths = [];
	while (remaining.size) {
		const first = edges.get(remaining.values().next().value);
		const start = adjacency.get(first.from).length !== 2 ? first.from : adjacency.get(first.to).length !== 2 ? first.to : first.from;
		const path = [start];
		let current = start;
		while (true) {
			const key = adjacency.get(current).find((key) => remaining.has(key));
			if (!key) break;
			remaining.delete(key);
			const edge = edges.get(key);
			current = edge.from === current ? edge.to : edge.from;
			path.push(current);
			if (current === start || adjacency.get(current).length !== 2) break;
		}
		if (path.length > 1) paths.push(path);
	}
	return paths;
}
//#endregion
//#region browser-ui/vf-antialiased-screen-renderer.mjs
function createAntialiasedScreenSpaceRenderer(canvas, createRenderer = createScreenSpaceSimplexRenderer, options = {}) {
	return createRenderer(new Proxy(canvas, {
		get(target, property) {
			if (property === "getContext") return (kind, options) => kind === "webgpu" ? null : target.getContext(kind, kind === "webgl2" ? {
				...options || {},
				antialias: true
			} : options);
			const value = Reflect.get(target, property, target);
			return typeof value === "function" ? value.bind(target) : value;
		},
		set(target, property, value) {
			return Reflect.set(target, property, value, target);
		}
	}), options);
}
//#endregion
//#region browser-ui/vf-geometry-property-capabilities.mjs
var GEOMETRY = /* @__PURE__ */ new Set([
	"p",
	"x",
	"y",
	"z",
	"v",
	"vx",
	"vy",
	"vz",
	"a",
	"L",
	"vertex_px_radius",
	"vertex_radius",
	"edge_px_width",
	"edge_width",
	"c"
]);
var MASS = [
	"m",
	"lambda_m",
	"sigma_m",
	"rho_m"
];
var MODULE_PROPERTIES = {
	inertia: [
		...MASS,
		"k",
		"k_theta"
	],
	gravity: MASS,
	specialRelativity: MASS,
	rigidCollisions: [
		...MASS,
		"k",
		"k_theta",
		"eta",
		"nu",
		"P"
	],
	em: [
		...MASS,
		"q",
		"lambda_q",
		"sigma_q",
		"rho_q",
		"epsilon",
		"mu",
		"sigma_e",
		"E",
		"B",
		"phi"
	],
	temperature: [
		...MASS,
		"T",
		"kappa",
		"alpha",
		"c_p",
		"h",
		"epsilon_rad"
	],
	light: ["epsilon", "mu"]
};
function allowedGeometryProperties(descriptors, { physicsEnabled = false, physics = null } = {}) {
	const available = new Set(physicsEnabled && physics ? Object.entries(MODULE_PROPERTIES).filter(([module]) => physics[module]).flatMap(([, names]) => names) : []);
	return descriptors.filter(({ name }) => GEOMETRY.has(name) || physicsEnabled && (physics == null || available.has(name)));
}
//#endregion
//#region browser-ui/vf-retained-plot-element.mjs
async function mountRetainedPlot(container, packet, { dimensions = null, bounds, selectionColor = "#00ffff", onSelectionChange = () => {}, interaction = null, onInteractionChange = () => {} } = {}) {
	if (!container?.ownerDocument || typeof container.append !== "function") throw new TypeError("plot container must be a DOM element");
	const meshes = packet?.metadata?.scene?.meshes || [];
	dimensions ??= meshes.some((mesh) => mesh.mode3d === true) ? 3 : 2;
	if (dimensions !== 2 && dimensions !== 3) throw new RangeError("plot presentation requires two or three dimensions");
	if (!bounds) {
		const ranges = {};
		for (const axis of [
			"x",
			"y",
			"z"
		]) {
			const spans = meshes.map((mesh) => [mesh.axis_ticks?.[axis + "_min"], mesh.axis_ticks?.[axis + "_max"]]).filter(([min, max]) => Number.isFinite(min) && Number.isFinite(max) && max > min);
			if (spans.length) ranges[axis] = [Math.min(...spans.map((span) => span[0])), Math.max(...spans.map((span) => span[1]))];
		}
		if (Object.keys(ranges).length) bounds = ranges;
	}
	const canvas = container.ownerDocument.createElement("canvas");
	canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
	canvas.tabIndex = 0;
	canvas.setAttribute("aria-label", "Plot");
	container.append(canvas);
	const renderer = createAntialiasedScreenSpaceRenderer(canvas);
	const coordinates = dimensions === 3 ? createCoordinateView3d({ bounds }) : createCoordinateView({ bounds });
	let disposed = false, active = null;
	const view = createRetainedPlotView({
		coordinates,
		renderer,
		selectionColor
	});
	const local = (event) => {
		const rect = canvas.getBoundingClientRect();
		return [event.clientX - rect.left, event.clientY - rect.top];
	};
	const render = () => {
		if (!disposed) view.render();
	};
	const resize = () => {
		if (disposed) return;
		const rect = canvas.getBoundingClientRect();
		coordinates.resize(rect.width, rect.height);
		renderer.resize(rect.width, rect.height);
		view.invalidate();
		render();
	};
	const down = (event) => {
		if (event.button !== 0) return;
		interaction?.cancel();
		const point = local(event), hit = view.hitTest(point, { capability: "draggable" });
		const objectDrag = Boolean(hit && interaction?.begin(hit.id, point, coordinates, { dimensions }));
		active = {
			id: event.pointerId,
			origin: point,
			last: point,
			dragged: false,
			objectDrag
		};
		canvas.setPointerCapture(event.pointerId);
	};
	const move = (event) => {
		if (!active || event.pointerId !== active.id) return;
		const point = local(event);
		if (Math.hypot(point[0] - active.origin[0], point[1] - active.origin[1]) >= 4) active.dragged = true;
		if (active.dragged) {
			if (active.objectDrag) {
				const update = interaction.move(point);
				if (update) onInteractionChange(update);
			} else coordinates.pan(active.last, point);
			render();
		}
		active.last = point;
	};
	const up = (event) => {
		if (!active || event.pointerId !== active.id) return;
		if (!active.dragged) {
			view.selectAt(local(event), { additive: event.shiftKey });
			render();
			onSelectionChange(view.selection());
		}
		interaction?.end();
		if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
		active = null;
	};
	const cancel = () => {
		interaction?.cancel();
		active = null;
	};
	const wheel = (event) => {
		event.preventDefault();
		coordinates.zoomAt(local(event), event.deltaY);
		render();
	};
	const key = (event) => {
		if (event.key === "Escape") {
			view.clearSelection();
			render();
			onSelectionChange(view.selection());
		}
	};
	let observer;
	try {
		await renderer.initialize();
		view.replaceArena(packet);
		canvas.addEventListener("pointerdown", down);
		canvas.addEventListener("pointermove", move);
		canvas.addEventListener("pointerup", up);
		canvas.addEventListener("pointercancel", cancel);
		canvas.addEventListener("wheel", wheel, { passive: false });
		canvas.addEventListener("keydown", key);
		observer = new container.ownerDocument.defaultView.ResizeObserver(resize);
		observer.observe(container);
		resize();
	} catch (error) {
		renderer.destroy();
		canvas.remove();
		throw error;
	}
	return Object.freeze({
		canvas,
		coordinates,
		selection: view.selection,
		update(next) {
			if (disposed) throw new Error("plot view is disposed");
			view.replaceArena(next);
			render();
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			interaction?.cancel();
			active = null;
			observer.disconnect();
			for (const [name, handler] of [
				["pointerdown", down],
				["pointermove", move],
				["pointerup", up],
				["pointercancel", cancel],
				["wheel", wheel],
				["keydown", key]
			]) canvas.removeEventListener(name, handler);
			renderer.destroy();
			canvas.remove();
		}
	});
}
//#endregion
//#region browser-ui/vf-native-plot-interaction.mjs
function createNativePlotInteraction({ targets = {} } = {}) {
	const entries = /* @__PURE__ */ new Map();
	for (const [id, target] of Object.entries(targets)) entries.set(id, prepare(target));
	let active = null;
	function begin(id, screen, coordinates, { dimensions = 2 } = {}) {
		active = null;
		const target = entries.get(id);
		if (!target || dimensions === 3 && !target.constraint) return false;
		const constraint = target.constraint ?? {
			kind: "plane",
			point: [
				0,
				0,
				0
			],
			normal: [
				0,
				0,
				1
			]
		};
		const hit = constrainedPoint(screen, coordinates, dimensions, constraint);
		if (!hit) return false;
		const state = target.runtime.readState();
		const local = [
			"x",
			"y",
			"z"
		].map((axis) => state[target.positionFields[axis]]);
		active = {
			id,
			target,
			coordinates,
			dimensions,
			constraint,
			offset: subtract(toWorld(target.reference, vector(local, "native position")), hit)
		};
		return true;
	}
	function move(screen) {
		if (!active) return null;
		const { id, target, coordinates, dimensions, constraint, offset } = active;
		const hit = constrainedPoint(screen, coordinates, dimensions, constraint);
		if (!hit) return null;
		const local = toLocal(target.reference, add(hit, offset));
		const input = { ...target.runtime.readInput() };
		for (const [index, axis] of [
			"x",
			"y",
			"z"
		].entries()) input[target.inputFields[axis]] = target.quantized ? Math.round(local[index]) : local[index];
		target.runtime.writeInput(input);
		target.runtime.update();
		return Object.freeze({
			id,
			state: Object.freeze({ ...target.runtime.readState() })
		});
	}
	function end() {
		active = null;
	}
	return Object.freeze({
		begin,
		move,
		end,
		cancel: end
	});
}
function prepare(target) {
	const { runtime, inputFields, positionFields, quantized = false } = target;
	for (const name of [
		"inputLayout",
		"readInput",
		"writeInput",
		"readState",
		"update"
	]) if (typeof runtime?.[name] !== "function") throw new TypeError("interaction requires a compiled writable-input runtime");
	const fields = runtime.inputLayout().fields;
	for (const axis of [
		"x",
		"y",
		"z"
	]) {
		if (typeof positionFields?.[axis] !== "string") throw new TypeError("native position fields must be declared");
		const field = fields.find((field) => field.name === inputFields?.[axis]);
		if (!field || field.axis_length) throw new TypeError("native scalar input fields must be declared");
		if (!["f64", "f32"].includes(field.storage ?? field.type) && !quantized) throw new TypeError("integer native position input requires quantized:true");
	}
	const reference = referenceFrame(target.referenceSystem);
	const constraint = target.constraint ? prepareConstraint(target.constraint) : null;
	return {
		runtime,
		inputFields: { ...inputFields },
		positionFields: { ...positionFields },
		quantized,
		reference,
		constraint
	};
}
function referenceFrame(system) {
	if (system === "world") return {
		origin: [
			0,
			0,
			0
		],
		basis: [
			[
				1,
				0,
				0
			],
			[
				0,
				1,
				0
			],
			[
				0,
				0,
				1
			]
		]
	};
	const origin = vector(system?.origin, "reference origin");
	if (!Array.isArray(system?.basis) || system.basis.length !== 3) throw new TypeError("reference axes must be declared");
	const basis = system.basis.map((axis) => vector(axis, "reference axis"));
	for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (Math.abs(dot(basis[i], basis[j]) - (i === j ? 1 : 0)) > 1e-8) throw new TypeError("reference axes must be orthonormal");
	return {
		origin,
		basis
	};
}
function prepareConstraint(value) {
	const point = vector(value.point, "constraint point");
	if (value.kind === "plane") return {
		kind: "plane",
		point,
		normal: unit(value.normal)
	};
	if (value.kind === "axis") return {
		kind: "axis",
		point,
		direction: unit(value.direction)
	};
	throw new TypeError("drag constraint must be a declared plane or axis");
}
function constrainedPoint(screen, coordinates, dimensions, constraint) {
	const ray = dimensions === 3 ? coordinates.screenLine(screen) : {
		point: [...coordinates.screenToWorld(screen).slice(0, 2), 0],
		direction: [
			0,
			0,
			1
		]
	};
	if (constraint.kind === "plane") {
		const denominator = dot(ray.direction, constraint.normal);
		if (Math.abs(denominator) < 1e-10) return null;
		return add(ray.point, scale(ray.direction, dot(subtract(constraint.point, ray.point), constraint.normal) / denominator));
	}
	const direction = constraint.direction;
	const alignment = dot(direction, ray.direction);
	const denominator = 1 - alignment * alignment;
	if (Math.abs(denominator) < 1e-10) return null;
	const delta = subtract(ray.point, constraint.point);
	return add(constraint.point, scale(direction, (dot(delta, direction) - alignment * dot(delta, ray.direction)) / denominator));
}
function vector(value, label) {
	if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) throw new TypeError(label + " requires three finite coordinates");
	return [...value];
}
var dot = (a, b) => a.reduce((total, value, index) => total + value * b[index], 0);
var add = (a, b) => a.map((value, index) => value + b[index]);
var subtract = (a, b) => a.map((value, index) => value - b[index]);
var scale = (a, factor) => a.map((value) => value * factor);
function unit(value) {
	const result = vector(value, "constraint direction"), length = Math.hypot(...result);
	if (length < 1e-10) throw new TypeError("constraint direction must be nonzero");
	return scale(result, 1 / length);
}
var toWorld = (frame, local) => frame.basis.reduce((world, axis, index) => add(world, scale(axis, local[index])), frame.origin);
var toLocal = (frame, world) => frame.basis.map((axis) => dot(subtract(world, frame.origin), axis));
//#endregion
export { allowedGeometryProperties, applyVkfViewGesture, buildCrosshair3dScene, createAntialiasedScreenSpaceRenderer, createCoordinateView, createCoordinateView3d, createNativePlotInteraction, createRetainedGeometryScene, createRetainedPlotView, edgeRenderPresentation, edgeScreenWidth, inverseTransformVkfViewPoint, materializeRetainedSceneArena, mountRetainedPlot, nearestVisibleGridSnap, normalizeVkfViewTransform, snapRelativeScale, snapRotationDelta, transformVkfViewPoint, vertexRenderPresentation, vertexScreenRadius, visibleGridSnapCandidates };
