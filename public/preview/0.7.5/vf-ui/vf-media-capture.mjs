export function createSceneMediaCapture(options = {}) {
  const requestStream = options.requestStream || ((request) => requestSceneCaptureStream({
    ...request,
    fallbackCanvas: options.fallbackCanvas,
    frameRate: options.frameRate
  }));
  const captureFrame = options.captureFrame || captureVideoFrame;
  const createRecorder = options.createRecorder || defaultRecorder;
  const wait = options.wait || delay;
  const setClean = options.setClean || (() => {});
  let movie = null;
  let frameMovie = null;

  async function screenshot({ delayMs = 0 } = {}) {
    if (movie || frameMovie) throw new Error('A movie capture is already active');
    const stream = await requestStream({ kind: 'image' });
    setClean(true, 'image');
    try {
      await wait(Math.max(0, Number(delayMs) || 0));
      return await captureFrame(stream, options);
    } finally {
      stopStream(stream);
      setClean(false, 'image');
    }
  }

  async function startMovie({ delayMs = 0 } = {}) {
    if (movie || frameMovie) return false;
    const active = { controller: new AbortController(), stream: null, recording: null, clean: false };
    movie = active; // Reserve startup too; cancel/dispose must reach it.
    try {
      active.stream = await requestStream({ kind: 'video', signal: active.controller.signal });
      if (active.controller.signal.aborted) throw active.controller.signal.reason;
      setClean(true, 'video'); active.clean = true;
      await wait(Math.max(0, Number(delayMs) || 0));
      if (active.controller.signal.aborted) throw active.controller.signal.reason;
      active.recording = createRecorder(active.stream, options);
      active.recording.start();
      return true;
    } catch (error) {
      stopStream(active.stream);
      if (movie === active) movie = null;
      if (active.clean) { active.clean = false; setClean(false, 'video'); }
      throw error;
    }
  }

  async function startFrameMovie(settings = {}) {
    if (movie || frameMovie) throw new Error('A movie capture is already active');
    const token = { canceled: false, encoder: null, done: null, resolve: null };
    token.done = new Promise(resolve => { token.resolve = resolve; });
    frameMovie = token;
    setClean(true, 'video');
    const release = () => {
      if (frameMovie === token) { frameMovie = null; setClean(false, 'video'); }
      token.resolve();
    };
    try {
      const { createFrameMovieCapture } = await import('./vf-frame-movie-capture.mjs?sha256=a244d3729ceb3bead11b46050245147aab5df35b2025ecaaa5f3067c6f39d95e');
      if (token.canceled) throw new DOMException('Capture canceled', 'AbortError');
      token.encoder = await createFrameMovieCapture({ ...settings, onClose: release });
      if (token.canceled) { await token.encoder.cancel(); throw new DOMException('Capture canceled', 'AbortError'); }
      return token.encoder;
    } catch (error) { release(); throw error; }
  }

  async function stopMovie() {
    if (frameMovie) {
      if (!frameMovie.encoder) throw new Error('Frame movie is still starting');
      return frameMovie.encoder.finish();
    }
    if (!movie) return null;
    const active = movie;
    if (!active.recording) { cancel(); return null; }
    try {
      return await active.recording.stop();
    } finally {
      if (movie === active) movie = null;
      stopStream(active.stream);
      if (active.clean) { active.clean = false; setClean(false, 'video'); }
    }
  }

  function cancel() {
    if (frameMovie) {
      const active = frameMovie;
      active.canceled = true;
      return active.encoder ? active.encoder.cancel() : active.done.then(() => true);
    }
    if (!movie) return false;
    const active = movie;
    movie = null;
    active.controller.abort(new DOMException('Capture canceled', 'AbortError'));
    try { active.recording?.cancel?.(); } finally {
      stopStream(active.stream);
      if (active.clean) { active.clean = false; setClean(false, 'video'); }
    }
    return true;
  }

  return Object.freeze({
    screenshot,
    startMovie,
    startFrameMovie,
    stopMovie,
    cancel,
    get recording() { return movie != null || frameMovie != null; }
  });
}

export async function copyCapturedMedia(blob, {
  clipboard = globalThis.navigator?.clipboard,
  ClipboardItemClass = globalThis.ClipboardItem,
  fallbackText = ''
} = {}) {
  if (clipboard?.write && ClipboardItemClass) {
    try {
      await clipboard.write([new ClipboardItemClass({ [blob.type]: blob })]);
      return 'blob';
    } catch (error) {
      if (!clipboard?.writeText || !fallbackText) throw error;
    }
  }
  if (clipboard?.writeText && fallbackText) {
    await clipboard.writeText(fallbackText);
    return 'url';
  }
  throw new Error('Media clipboard is unavailable');
}

export function writeCapturedMediaDrag(dataTransfer, { blob, url, filename }) {
  if (!dataTransfer || !url) return false;
  dataTransfer.effectAllowed = 'copy';
  dataTransfer.setData('text/uri-list', url);
  dataTransfer.setData('DownloadURL', `${blob.type}:${filename}:${url}`);
  return true;
}

export function downloadCapturedMedia({ url, filename }, documentRef = globalThis.document) {
  const anchor = documentRef.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

export function createLayeredCanvasCaptureStream(options = {}) {
  const layers = Array.isArray(options.layers) ? options.layers : [];
  const documentRef = options.document || options.documentRef || globalThis.document;
  const frameRate = Math.max(1, Number(options.frameRate) || 60);
  const requestFrame = options.requestFrame
    || globalThis.requestAnimationFrame?.bind(globalThis)
    || ((callback) => setTimeout(callback, 1000 / frameRate));
  const cancelFrame = options.cancelFrame
    || globalThis.cancelAnimationFrame?.bind(globalThis) || clearTimeout;
  const controller = new AbortController();
  let closed = false, scheduled = null, stream = null;
  const output = documentRef?.createElement?.('canvas');
  const context = output?.getContext?.('2d');
  if (!output || !context || typeof output.captureStream !== 'function') {
    throw new Error('Layered canvas capture is unavailable');
  }
  const resolveLayers = () => options.frameProvider
    ? options.frameProvider({ signal: controller.signal })
    : layers.map(layer => typeof layer === 'function' ? layer() : layer);
  const canvases = value => (Array.isArray(value) ? value : [value])
    .filter(layer => layer?.width > 0 && layer?.height > 0);
  function close() {
    if (closed) return;
    closed = true;
    controller.abort(new DOMException('Capture canceled', 'AbortError'));
    if (scheduled !== null) { cancelFrame(scheduled); scheduled = null; }
    options.signal?.removeEventListener('abort', close);
    for (const track of stream?.getTracks?.() || []) track.stop();
  }
  function draw(activeLayers) {
    const primary = activeLayers[0];
    if (!primary) throw new Error('Layered canvas capture requires a canvas layer');
    if (output.width !== primary.width || output.height !== primary.height) {
      output.width = primary.width; output.height = primary.height;
    }
    context.clearRect(0, 0, output.width, output.height);
    for (const layer of activeLayers) context.drawImage(layer, 0, 0, output.width, output.height);
  }
  function begin(value) {
    if (closed) throw controller.signal.reason;
    try {
      draw(canvases(value));
      stream = output.captureStream(frameRate);
      stream.__vfCaptureCleanup = close;
      // Readback frames are explicitly requested only after composition. The
      // synchronous layer API retains its normal canvas capture cadence.
      for (const track of stream.getVideoTracks?.() || []) track.requestFrame?.();
      scheduled = requestFrame(compositeFrame);
      return stream;
    } catch (error) { close(); throw error; }
  }
  async function compositeFrame() {
    scheduled = null;
    if (closed) return;
    const tracks = stream?.getVideoTracks?.() || [];
    if (tracks.length && tracks.every(track => track.readyState === 'ended')) { close(); return; }
    try {
      options.beforeDraw?.();
      const activeLayers = canvases(await resolveLayers());
      if (closed) return;
      // A changed/removed owner cannot be replaced by a cached image.
      draw(activeLayers);
      for (const track of tracks) if (track.readyState !== 'ended') track.requestFrame?.();
      // One awaited provider at a time; never pile up GPU readback buffers.
      scheduled = requestFrame(compositeFrame);
    } catch (error) {
      if (closed) return;
      stream.__vfCaptureError = error;
      close(); options.onError?.(error);
    }
  }
  options.signal?.addEventListener('abort', close, { once: true });
  if (options.signal?.aborted) close();
  try {
    if (closed) throw controller.signal.reason;
    options.beforeDraw?.();
    const initial = resolveLayers();
    // Preserve the synchronous return contract for existing canvas layers.
    return initial?.then ? initial.then(begin, error => { close(); throw error; }) : begin(initial);
  } catch (error) { close(); throw error; }
}

export async function requestSceneCaptureStream({
  kind = 'image',
  mediaDevices = globalThis.navigator?.mediaDevices,
  fallbackCanvas = null,
  frameRate = 60
} = {}) {
  const canvas = typeof fallbackCanvas === 'function' ? fallbackCanvas() : fallbackCanvas;
  if (kind === 'video' && canvas?.captureStream) return canvas.captureStream(frameRate);
  if (mediaDevices?.getDisplayMedia) {
    return mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser', cursor: 'never' },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude'
    });
  }
  if (canvas?.captureStream) return canvas.captureStream(frameRate);
  throw new Error('Scene capture is unavailable');
}

async function captureVideoFrame(stream, options = {}) {
  const documentRef = options.document || globalThis.document;
  const video = documentRef.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  await video.play();
  if (!video.videoWidth || !video.videoHeight) {
    await new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true }));
  }
  await nextPaint();
  const canvas = documentRef.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  video.srcObject = null;
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('Screenshot encoding failed')),
    'image/png'
  ));
}

function defaultRecorder(stream, options = {}) {
  const Recorder = options.MediaRecorderClass || globalThis.MediaRecorder;
  if (!Recorder) throw new Error('Movie capture is unavailable');
  const mimeType = supportedMovieType(Recorder);
  const recorder = new Recorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  // Attach before start: track closure/error can stop MediaRecorder before
  // the user presses Stop. That completed event must remain awaitable.
  const stopped = new Promise((resolve, reject) => {
    recorder.addEventListener('error', () => { stopStream(stream); reject(recorder.error || new Error('Movie capture failed')); }, { once: true });
    recorder.addEventListener('stop', () => stream.__vfCaptureError ? reject(stream.__vfCaptureError) : resolve(new Blob(chunks, {
      type: recorder.mimeType || mimeType || 'video/webm'
    })), { once: true });
  });
  stopped.catch(() => {});
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data?.size) chunks.push(event.data);
  });
  return {
    start() { recorder.start(250); },
    stop() {
      if (recorder.state !== 'inactive') recorder.stop();
      return stopped;
    },
    cancel() {
      if (recorder.state !== 'inactive') recorder.stop();
    }
  };
}

function supportedMovieType(Recorder) {
  return ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((type) => typeof Recorder.isTypeSupported !== 'function' || Recorder.isTypeSupported(type)) || '';
}

function stopStream(stream) {
  stream?.__vfCaptureCleanup?.();
  for (const track of stream?.getTracks?.() || []) track.stop();
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function nextPaint() {
  return new Promise((resolve) => (globalThis.requestAnimationFrame || setTimeout)(resolve));
}
