import {semanticVkfTokens} from './semantic-vkf.mjs';
// Preserve Prism as the shared renderer; contextual tokens never rewrite source.
export const TEXTMATE_GRAMMAR_SHA256 = 'b1aa632c44ec6132a36cf045a1adc79152bb5b7c6261e49d5c115bb62137fd89';
const registered = new WeakSet();
export function registerVektorFlowPrism(Prism) {
  if (!Prism?.languages) throw new TypeError('Prism.languages is required.');
  Prism.languages.vkf = Prism.languages.vektorflow = {plain: /[\s\S]+/};
  if (!registered.has(Prism)) {
    Prism.hooks.add('after-tokenize', env => {
      if (env.language !== 'vkf' && env.language !== 'vektorflow') return;
      env.tokens = semanticVkfTokens(env.code).map(t => t.kind === 'plain'
        ? t.value : new Prism.Token(t.kind, t.value, t.alias, t.value));
    });
    registered.add(Prism);
  }
  return Prism.languages.vkf;
}
