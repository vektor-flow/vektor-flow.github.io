import { compilePhysicsUpdate } from './physics-update-runtime.mjs';
let update;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'compile') {
      update = await compilePhysicsUpdate(data.source, { dimension: data.dimension });
      self.postMessage({ id: data.id, type: 'ready' });
    } else if (data.type === 'step') {
      if (!update) throw new Error('The update function is not compiled.');
      if (!Array.isArray(data.states) || data.states.length > 1024) throw new RangeError('Custom update exceeds 1024 vertices.');
      const states = data.states.map(state => ({ id: state.id, ...update.step(state, data.timeStep) }));
      self.postMessage({ id: data.id, type: 'state', states });
    }
  } catch (error) { self.postMessage({ id: data.id, type: 'error', message: error.message }); }
};
