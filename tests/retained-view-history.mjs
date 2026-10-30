// Browser function consumed by the existing actual owner's page.evaluate.
// Mount a CURRENT compiled finite scene through mountRetainedSceneResult first;
// await dispose.presented. This is a UI regression, never 5M/fullworld acceptance.
export async function exerciseRetainedViewHistory({frameId}) {
  const api = globalThis.VfDisplay;
  const root = document.querySelector(`[data-vf-frame-id="${CSS.escape(frameId)}"]`);
  const body = root?.querySelector('.vf-frame__body');
  const need = (value, label) => { if (!value) throw Error(label); };
  need(body && body.__vfViewHistory && api?.getGeomFramePresentedView, 'NORMAL_CONTROLLED_RETAINED_FRAME');
  const history = body.__vfViewHistory;
  const signature = snapshot => JSON.stringify(snapshot);
  const current = () => api.getGeomFramePresentedView(frameId);
  const wait = async (predicate, label) => {
    const began = performance.now();
    while (!predicate()) {
      if (performance.now() - began > 7000) throw Error(label);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    return current();
  };
  const settled = expected => wait(() => !api.geomFrameStatus(frameId).viewTransitionActive &&
    signature(current()?.snapshot) === signature(expected), 'EXACT_PRESENTED_ENDPOINT');
  const command = name => body.dispatchEvent(new CustomEvent('vf-view-command', {
    bubbles: true, cancelable: true, detail: {command: name},
  }));
  const initial = current();
  need(initial?.endpoint === 'gpu-queue-completed' || initial?.endpoint === 'canvas-command-completed', 'REAL_INITIAL_PRESENTATION');
  need(signature(history.current()) === signature(initial.snapshot), 'HISTORY_SEEDED_FROM_PRESENTED_VIEW');
  const changes = [];
  for (let n = 0; n < 2; n++) {
    const before = signature(history.current());
    command('zoom-in');
    await wait(() => signature(history.current()) !== before, 'ZOOM_GESTURE_HISTORY_COMMIT');
    changes.push((await settled(history.current())).snapshot);
  }
  command('back');
  need(signature(history.current()) === signature(changes[0]), 'ONE_BACK_MOVES_EXACTLY_ONE_HISTORY_ENTRY');
  const intermediate = await wait(() => {
    const view = current();
    return api.geomFrameStatus(frameId).viewTransitionActive &&
      signature(view?.snapshot) !== signature(changes[0]) &&
      signature(view?.snapshot) !== signature(changes[1]);
  }, 'HISTORY_HAS_ACTUAL_INTERMEDIATE_DRAW');
  // Retarget while the old destination is pending. The public presented getter
  // must stay at this completed pose until another real draw completes.
  command('forward');
  need(signature(history.current()) === signature(changes[1]), 'ONE_FORWARD_MOVES_EXACTLY_ONE_HISTORY_ENTRY');
  need(signature(current().snapshot) === signature(intermediate.snapshot), 'RETARGET_DOES_NOT_LABEL_REQUESTED_DESTINATION_PRESENTED');
  await settled(changes[1]);
  need(!history.canForward(), 'SUPERSEDED_BACK_DID_NOT_COMMIT_OR_MOVE_CURSOR');
  command('back'); await settled(changes[0]);
  command('home'); await settled(initial.snapshot);
  command('home'); await settled(initial.snapshot);
  command('back'); await settled(changes[0]);
  // A repeated Home must not create a duplicate endpoint; Back returns once.
  need(history.canBack(), 'HOME_DEDUPLICATION_PRESERVES_PREVIOUS_HISTORY');
  const rect = body.getBoundingClientRect();
  const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
  const beforePan = signature(history.current());
  const pointer = (name, px, py, buttons) => body.dispatchEvent(new PointerEvent(name, {
    bubbles: true, cancelable: true, pointerId: 77, pointerType: 'mouse', isPrimary: true,
    button: 0, buttons, shiftKey: true, clientX: px, clientY: py,
  }));
  pointer('pointerdown', x, y, 1);
  pointer('pointermove', x + 32, y + 16, 1);
  await new Promise(resolve => requestAnimationFrame(resolve));
  pointer('pointerup', x + 32, y + 16, 0);
  await wait(() => signature(history.current()) !== beforePan, 'ORDINARY_PAN_COMMITTED_PRESENTED_VIEW');
  await settled(history.current());
  need(!history.canForward(), 'GESTURE_BRANCH_DISCARDS_FORWARD_HISTORY');
  command('back'); await settled(changes[0]);
  command('back'); await settled(initial.snapshot);
  need(!history.canBack(), 'NO_INTERMEDIATE_ANIMATION_HISTORY_ENTRIES');
  return {status:'PASS_RETAINED_VIEW_HISTORY', endpoint:initial.endpoint,
    intermediateSerial:intermediate.serial, finalSerial:current().serial,
    scope:'ordinary zoom/pan/back/forward/home, interruption, exact completed endpoints and branch semantics; no physical GPU/fullscale claim from Canvas'};
}

// Finite math controls for the two actual regressions (AS DATA, unrun here).
export function checkRetainedViewInterpolation() {
  const api = globalThis.VfDisplay.__test;
  const close = (a,b) => Math.abs(a-b) < 1e-10;
  for (const [u,expected] of [[0,0],[.25,.125],[.5,.5],[.75,.875],[1,1]]) {
    if (!close(api.smooth01(u),expected) || !close(api.smooth01(u)+api.smooth01(1-u),1)) throw Error('QUADRATIC_VALUE_OR_REVERSE');
  }
  const from = {camera:{pos:[0,0,4],target:[0,0,0],up:[0,1,0]},axis3d:{},axes:[]};
  const to = {camera:{pos:[0,0,4],target:[0,0,0],up:[0,-1,0]},axis3d:{},axes:[]};
  for (const u of [.25,.5,.75]) {
    const forward = api.interpolateFrameView(from,to,api.smooth01(u),{meshes:[]});
    const reverse = api.interpolateFrameView(to,from,api.smooth01(1-u),{meshes:[]});
    if (!forward.camera.up.every((v,i)=>close(v,reverse.camera.up[i]))) throw Error('HALF_TURN_ROLL_REVERSE_PATH');
  }
  return {status:'PASS_QUADRATIC_AND_HALF_TURN_ROLL',scope:'finite helper math only, no UI/GPU qualification'};
}
