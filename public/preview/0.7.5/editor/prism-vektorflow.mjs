// Original grammar provenance; Prism fixes below are a separate e1155 edition.
export const TEXTMATE_GRAMMAR_SHA256 = 'b1aa632c44ec6132a36cf045a1adc79152bb5b7c6261e49d5c115bb62137fd89';

export function registerVektorFlowPrism(Prism) {
  if (!Prism?.languages) throw new TypeError('Prism.languages is required.');

  const interpolation = {
    pattern: /(^|[^\\])\$\([\s\S]*?\)/,
    lookbehind: true,
    inside: {
      punctuation: /^\$\(|\)$/,
      number: /\b\d+(?:\.\d+)?\b/,
    operator: /\.\.\.|:::|::|>>|==|~=|!=|!\?|<=|>=|=>|->|\/\/|\.\.|><|\/\\|\\\/|@::|@:|@>|@\||@!|[=<>+\-*/^%&~:$?.|!]/,
      function: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/,
      variable: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/,
    },
  };

  Prism.languages.vektorflow = {
    comment: [
      { pattern: /##[\s\S]*?(?:##|$)/, greedy: true },
      /#(?!#).*/,
    ],
    'triple-quoted-string': [
      { pattern: /"""[\s\S]*?"""/, greedy: true, alias: 'string' },
      { pattern: /'''[\s\S]*?'''/, greedy: true, alias: 'string' },
    ],
    string: {
      pattern: /"(?:\\.|[^"\\])*"/,
      greedy: true,
      inside: {
        interpolation,
        escape: /\\(?:["\\nrt$]|.)/,
      },
    },
    derivative: {pattern: /([A-Za-z0-9_)\]])['’]+[a-z]+/, lookbehind:true, alias:'operator'},
    template: {pattern: /'(?:\\.|[^'\\\n])*'/, greedy:true, alias:'string'},
    'line-print-sugar': { pattern: /:::/, alias: 'operator' },
    module: {
      pattern: /(:)(\.)([a-zA-Z_][a-zA-Z0-9_]*)/,
      inside: {
        punctuation: /^:\./,
        namespace: /[a-zA-Z_][a-zA-Z0-9_]*$/,
      },
    },
    'structural-axis-call': {
      pattern: /\b(?:(?:stat\.(?:sum|mean|variance|std|range|count|min|max|percentile|median|iqr|mode|zscore|normalize|covariance|correlation))|(?:symbolic\.(?:integ|integrate|deriv|differentiate|diff|limit|roots|polynomial|depends_on|substitute)))_([a-z]+)(?=\s*\()/,
      inside: {
        namespace: /^(?:stat|symbolic)/,
        punctuation: /\./,
        function: /(?:sum|mean|variance|std|range|count|min|max|percentile|median|iqr|mode|zscore|normalize|covariance|correlation|integ|integrate|deriv|differentiate|diff|limit|roots|polynomial|depends_on|substitute)(?=_)/,
        dimension: /_[a-z]+$/,
      },
    },
    'selected-axis-call': {
      pattern: /(^|[^.\w])([A-Za-z][A-Za-z0-9]*)_([a-z]+)(?=\s*\()/,
      lookbehind:true, inside:{ function:/^[A-Za-z][A-Za-z0-9]*(?=_)/, dimension:/_[a-z]+$/ }
    },
    'stdlib-call': {
      pattern: /\b(?:math|stat|random|time|io|collections|errors|system|process|regex|linalg|physics|symbolic)\b\s*\.\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(?=\()/,
      inside: {
        namespace: /^[a-zA-Z_][a-zA-Z0-9_]*/,
        punctuation: /\./,
        function: /[a-zA-Z_][a-zA-Z0-9_]*$/,
      },
    },
    'function-definition': {
      pattern: /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(?:\[[^\]\n]*\]\s*)?\([^\n)]*\)\s*(?:->\s*[^:\n]+)?\s*:(?:\s*(?:#.*)?)?$/m,
      inside: {
        function: /^[\s]*[a-zA-Z_][a-zA-Z0-9_]*/,
        parameter: /\([^)]*\)/,
        operator: /->/,
        punctuation: /[():]/,
      },
    },
    binding: { pattern: /^\s*[a-zA-Z_][a-zA-Z0-9_]*(?=\s*:(?!::))/m, alias: 'variable' },
    boolean: /\b(?:true|false)\??\b/,
    wildcard: { pattern: /\b_\?/, alias: 'operator' },
    builtin: /\b(?:bit|chr|dig|int|num|str|type|any)\b/,
    number: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
    'anonymous-dimension': /\.\.\./,
    'attached-dimension': {
      pattern: /([0-9'"\])}])_(?:[a-z]+|[0-9]+)\b/,
      lookbehind: true,
      alias: 'dimension',
    },
    dimension: {
      pattern: /\b[A-Za-z][A-Za-z0-9]*_(?!min\b|max\b|pot\b|tot\b|count\b)(?:[a-z]+|[0-9]+)\b(?!\s*[:(])/,
      alias: 'dimension',
    },
    operator: /:::|::|>>|==|~=|!=|!\?|<=|>=|=>|->|\/\/|\.\.|><|\/\\|\\\/|@::|@:|@>|@\||@!|\(\s*[+\-*/]\s*\)|\{\s*[+\-*/]\s*\}|[=<>+\-*/^%&~:$?.|!]/,
    function: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/,
    'class-name': /\b[A-Z][a-zA-Z0-9_]*\b/,
    variable: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/,
    punctuation: /[;,()[\]{}]/,
  };
  Prism.languages.vkf = Prism.languages.vektorflow;
  return Prism.languages.vektorflow;
}
