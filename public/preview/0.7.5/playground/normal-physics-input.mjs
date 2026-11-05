// Internal evaluated-value packing for the EXISTING immutable SI replay ABI.
// This is transport, not a source capability issuer or a physics implementation.
// Compiler-owned source-domain admission must precede this seam. In particular,
// a JSON record that happens to match these fields does not authorize a call.
const record = (value, names, where) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== names.length || names.some(name => !Object.hasOwn(value, name)))
    throw new TypeError('Incomplete or unsupported normal physics field: ' + where);
  return value;
};
const scalar = (value, where) => {
  if (typeof value !== 'number') throw new TypeError('Real SI numeric source field required: ' + where);
  return value;
};
const vector = (value, length, where) => {
  if (!Array.isArray(value) || value.length !== length)
    throw new TypeError('Independent normal physics vector required: ' + where);
  return value.map((item, index) => scalar(item, where + '.' + index));
};
const rows = (value, length, where) => {
  if (!Array.isArray(value) || (length !== undefined && value.length !== length) || value.length > 1000000)
    throw new TypeError('Complete normal physics row population required: ' + where);
  return value.map((item, index) => vector(item, 3, where + '.' + index));
};
export function packNormalReplayInput(value, durations) {
  const d = record(value, ['geometry', 'initial', 'gravity'], 'definition');
  const g = record(d.geometry, ['mass', 'volume', 'center_of_mass', 'inertia_tensor', 'geometry', 'material'], 'geometry');
  const mesh = record(g.geometry, ['vertices', 'faces'], 'geometry.geometry');
  const material = record(g.material, ['mu_s', 'mu_d', 'restitution'], 'geometry.material');
  const initial = record(d.initial, ['position', 'orientation', 'velocity', 'omega'], 'initial');
  const vertices = rows(mesh.vertices, undefined, 'vertices'), faces = rows(mesh.faces, undefined, 'faces');
  if (vertices.length < 4 || faces.length < 4 || vertices.length > 10000000 / faces.length)
    throw new RangeError('Normal physics mesh is outside the maintained replay domain');
  if (!Array.isArray(durations) || durations.length > 1000000)
    throw new TypeError('Complete normal physics duration history required');
  const words = [vertices.length, faces.length, scalar(g.mass, 'mass'),
    ...vector(g.center_of_mass, 3, 'center_of_mass')];
  for (const row of rows(g.inertia_tensor, 3, 'inertia_tensor')) for (const item of row) words.push(item);
  words.push(scalar(material.mu_s, 'mu_s'), scalar(material.mu_d, 'mu_d'), scalar(material.restitution, 'restitution'),
    ...vector(initial.position, 3, 'position'), ...vector(initial.orientation, 4, 'orientation'),
    ...vector(initial.velocity, 3, 'velocity'), ...vector(initial.omega, 3, 'omega'),
    ...vector(d.gravity, 3, 'gravity'));
  // Append by iteration: spreading the complete authored population into a
  // JavaScript argument list would impose an unrelated host argument limit.
  for (const row of vertices) for (const item of row) words.push(item);
  for (const row of faces) for (const item of row) words.push(item);
  // The legacy replay schema has no rolling/spinning resistance fields. Keep
  // its original zero defaults; unknown source properties were rejected above.
  words.push(scalar(g.volume, 'volume'), 0, 0);
  return {description: Float64Array.from(words), history: Float64Array.from(durations,
    (value, index) => scalar(value, 'history.' + index))};
}

// The maintained persistent prepare overload has one authored dynamic body
// and its complete static environment. Preserve BOTH descriptions, all rows,
// all nine inertia entries and explicit rolling/spinning coefficients. Only
// the existing target preparer decides whether a material is supported.
export function packNormalSessionInput(value) {
  const definition = record(value, ['body', 'environment', 'gravity'], 'persistent definition');
  const pack = (value, where) => {
    const body = record(value, ['geometry', 'initial', 'rolling_friction', 'spinning_friction'], where);
    const packed = packNormalReplayInput({geometry: body.geometry, initial: body.initial,
      gravity: definition.gravity}, []).description;
    packed[packed.length - 2] = scalar(body.rolling_friction, where + '.rolling_friction');
    packed[packed.length - 1] = scalar(body.spinning_friction, where + '.spinning_friction');
    return packed;
  };
  const body = pack(definition.body, 'body'), environment = pack(definition.environment, 'environment');
  const words = new Float64Array(2 + body.length + environment.length);
  words[0] = body.length; words[1] = environment.length;
  words.set(body, 2); words.set(environment, 2 + body.length);
  return words;
}
