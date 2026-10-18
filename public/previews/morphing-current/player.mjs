for (const section of document.querySelectorAll('.demo')) {
  const video = section.querySelector('video');
  const time = section.querySelector('[data-time]');
  const play = section.querySelector('[data-play]');
  const position = section.querySelector('[data-position]');
  const speed = section.querySelector('[data-speed]');
  const speedValue = section.querySelector('[data-speed-value]');
  const mode = section.dataset.mode;
  const meta = await fetch(`${mode}-verification.json`).then(response => {
    if (!response.ok) throw Error('Playback metadata unavailable');
    return response.json();
  });
  const maximum = meta.states.length - 1;
  time.max = maximum;
  video.muted = true;
  function show(value) {
    position.value = `State ${Math.min(maximum + 1, Math.floor(value + 1e-6) + 1)} / ${maximum + 1}`;
  }
  function update() {
    const value = Math.max(0, Math.min(maximum, (video.currentTime - meta.motionStart) / meta.secondsPerState));
    time.value = value;
    show(value);
  }
  time.addEventListener('input', () => {
    video.pause();
    const value = Number(time.value);
    show(value);
    video.currentTime = meta.motionStart + value * meta.secondsPerState;
  });
  speed.addEventListener('input', () => {
    video.playbackRate = Number(speed.value);
    speedValue.value = `${speed.value}×`;
  });
  play.addEventListener('click', async () => {
    if (!video.paused) {video.pause(); return;}
    if (video.ended || Number(time.value) >= maximum) video.currentTime = meta.motionStart;
    try {await video.play();} catch {play.textContent = 'Retry';}
  });
  video.addEventListener('play', () => {
    play.textContent = 'Pause';
    function tick() {
      if (video.paused) return;
      update();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  video.addEventListener('pause', () => {play.textContent = video.ended ? 'Replay' : 'Play';});
  video.addEventListener('ended', () => {update();play.textContent = 'Replay';});
  show(0);
  section.dataset.ready = 'true';
}
