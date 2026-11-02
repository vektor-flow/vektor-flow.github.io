// Conservative presentation analysis. This is not a compiler/type checker: an
// unresolved name is neutral, and only a known vector may acquire index colors.
// Tokens retain every source byte; the compiler and clipboard use the textarea.
const names = /^[A-Za-z_][A-Za-z0-9_]*/;
const structuralFunctions = new Set(['sum','mean','variance','std','range','ptp','count','min','max','percentile','median','iqr','mode','zscore','normalize','covariance','correlation','reduce','chain','deriv','integ']);
const builtins = new Set(['bit','chr','dig','int','num','str','type','any']);

function lex(source) {
  const result = [];
  let offset = 0;
  while (offset < source.length) {
    const rest = source.slice(offset);
    const rule = [
      ['comment', /^(?:##(?:[\s\S]*?##|[\s\S]*)|#(?!#)[^\n]*)/],
      ['string', /^(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\\n])*')/],
      ['number', /^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/],
      ['identifier', names],
      ['operator', /^(?:@::|:::|::|>>|==|~=|!=|!\?|<=|>=|=>|->|\/\/|\.\.\.|\.\.|><|\/\\|\\\/|@:|@>|@\||@!|[=<>+\-*/^%&~:$?.|!])/],
      ['punctuation', /^[;,()[\]{}]/],
      ['plain', /^\s+/],
    ].map(([kind, pattern]) => [kind, pattern.exec(rest)?.[0]]).find(([, value]) => value);
    const [kind, value] = rule ?? ['plain', rest[0]];
    result.push({kind, value, start:offset, end:offset + value.length});
    offset += value.length;
  }
  return result;
}

export function semanticVkfTokens(source) {
  const raw = lex(source);
  // Mask strings/comments without changing positions or line boundaries.
  const masked = raw.map(t => ['comment','string'].includes(t.kind) ? t.value.replace(/[^\n]/g,' ') : t.value).join('');
  const scopes = [{indent:-1, symbols:new Map(), parentBinding:null, vector:false, rank:0, axes:new Set()}];
  const annotations = new Map();
  const resolve = name => {
    for (let i=scopes.length-1;i>=0;i--) if (scopes[i].symbols.has(name)) return scopes[i].symbols.get(name);
    return null;
  };
  const axisBinding = (name, entry, symbols) => {
    // An attached-axis declaration introduces the base in the compiler grammar.
    // Restrict this fallback to the compact axis forms present in maintained
    // declarations; full legitimate names still win during reference lookup.
    const match=/^(.+)_([a-z]{1,3})$/.exec(name);
    if(entry.vector && match && match[2].length <= entry.rank && !symbols.has(match[1])) {
      const indexed={...entry,axes:new Set(match[2])};
      symbols.set(match[1],indexed);
      // Only resolve a selector when there is no conflicting earlier full name.
      // Keep the complete binding record too, so ordinary snake_case wins.
      entry.axisDeclaration={base:match[1],suffix:match[2]};
    }
  };
  const close = () => {
    const scope=scopes.pop();
    if (scope.parentBinding) {
      scope.parentBinding.vector=scope.vector;
      scope.parentBinding.rank=scope.rank;
      scope.parentBinding.axes=scope.axes;
      axisBinding(scope.bindingName,scope.parentBinding,scopes.at(-1).symbols);
    }
  };
  let offset=0;
  for (const line of masked.split('\n')) {
    const indent=/^\s*/.exec(line)[0].replace(/\t/g,'    ').length;
    if (!line.trim()) { offset+=line.length+1; continue; }
    while (scopes.length>1 && indent<=scopes.at(-1).indent) close();
    const current=scopes.at(-1);
    const tokens=raw.filter(t=>t.start>=offset && t.start<offset+line.length);
    const code=tokens.filter(t=>!['plain','comment','string'].includes(t.kind));
    // Function header: match balanced parentheses so nested defaults do not
    // turn a definition into a call. All declaration/parameter labels neutral.
    let definitionEnd=-1, functionName=null, params=[];
    if (code[0]?.kind==='identifier' && code[1]?.value==='(') {
      let depth=0;
      for(let i=1;i<code.length;i++) {
        if(code[i].value==='(')depth++;
        if(code[i].value===')' && --depth===0){
          let j=i+1;
          if(code[j]?.value==='->')while(j<code.length && code[j].value!==':')j++;
          if(code[j]?.value===':'){definitionEnd=code[j].end;functionName=code[0].value;params=code.slice(2,i).filter((t,k,a)=>t.kind==='identifier' && (k===0||a[k-1].value===','));}
          break;
        }
      }
    }
    let binding=null;
    if (!functionName && code[0]?.kind==='identifier' && code[1]?.value===':') binding=code[0];
    // A typed binding is a declaration as well.
    if (!binding && code[0]?.kind==='identifier' && code[1]?.kind==='identifier' && code[2]?.value===':') binding=code[1];
    const introduced=new Map(params.map(t=>[t.value,{vector:false, callable:false}]));
    let vector=false, rank=0, bracketDepth=0;
    const axes=new Set();
    const rhs=binding ? code.slice(code.indexOf(binding)+2) : code;
    const rhsText=rhs.map(t=>t.value).join('');
    // A vector argument does not make a scalar consumer's result a vector.
    // Unknown calls are conservative too; do not manufacture type knowledge.
    const scalarConsumer=/^(?:(?:[A-Za-z_]\w*)\.)?(?:min|max|ptp|sum|mean|count|variance|std|median|percentile|iqr|mode|covariance|correlation)\(/.test(rhsText)
      || /\.length\(\)$/.test(rhsText)
      || /^[A-Za-z_]\w*\.\([^:.,()]+(?:,[^:.,()]+)*\)$/.test(rhsText);
    const calls=rhs.filter((t,i)=>t.kind==='identifier' && rhs[i+1]?.value==='(');
    const knownElementwise=new Set(['sin','cos','exp','sqrt','abs','ln','log','clamp','sign']);
    const uncertainCall=calls.some(t=>!knownElementwise.has(t.value) && !/_([a-z]{1,3})$/.test(t.value)
      && !structuralFunctions.has(t.value) && t.value!=='length');
    for(let i=0;i<code.length;i++) {
      const t=code[i];
      if(t.value==='[' && code[i-1]?.kind!=='identifier'){vector=true;bracketDepth++;rank=Math.max(rank,bracketDepth);}
      if(t.value===']')bracketDepth=Math.max(0,bracketDepth-1);
      if(t.kind!=='identifier')continue;
      const next=code[i+1], prev=code[i-1];
      if(t.end<=definitionEnd || t===binding || next?.value===':') { annotations.set(t.start,[{kind:'definition',value:t.value}]); continue; }
      const symbol=introduced.get(t.value)??resolve(t.value);
      // A full legitimate underscore name wins over any potential selector.
      if(symbol && !symbol.axisDeclaration){
        vector ||= symbol.vector;
        rank=Math.max(rank,symbol.rank??0);
        for(const axis of symbol.axes??[])axes.add(axis);
        annotations.set(t.start,[{kind:next?.value==='('?'function':'variable',value:t.value}]);
        continue;
      }
      let structural=null;
      for(let at=t.value.lastIndexOf('_');at>0;at=t.value.lastIndexOf('_',at-1)) {
        const base=t.value.slice(0,at), suffix=t.value.slice(at+1);
        if(!/^[a-z]{1,4}$/.test(suffix))continue;
        const target=introduced.get(base)??resolve(base);
        const qualified=prev?.value==='.';
        const module=qualified?resolve(code[i-2]?.value)?.module:null;
        const familyKnown=target?.callable || (structuralFunctions.has(base) && (!qualified || module==='stat' || module==='symbolic'));
        const callable=next?.value==='(' && familyKnown;
        // Inspect only this call's balanced arguments, not later expressions.
        let end=i+2,depth=1;
        for(;end<code.length;end++){
          if(code[end].value==='(')depth++;
          if(code[end].value===')' && --depth===0)break;
        }
        const argumentRank=Math.max(0,...code.slice(i+2,end).map(a=>resolve(a.value)?.rank??0));
        const vectorArgument=callable && argumentRank>=suffix.length;
        if((target?.vector && suffix.length <= target.rank) || vectorArgument){structural={base,suffix,callable,target};break;}
      }
      if(structural){
        vector=true;
        rank=Math.max(rank,structural.target?.rank??1);
        for(const axis of structural.suffix)axes.add(axis);
        annotations.set(t.start,[{kind:structural.callable?'function':'variable',value:structural.base},{kind:'operator',value:'_'},...[...structural.suffix].map(value=>({kind:'dimension-index',value,alias:`vkf-index-${(value.charCodeAt(0)-97)%8}`}))]);
      } else if(t.value==='true'||t.value==='false') annotations.set(t.start,[{kind:'boolean',value:t.value}]);
      else if(builtins.has(t.value)) annotations.set(t.start,[{kind:'builtin',value:t.value}]);
      // Qualified member calls have a known receiver; property labels above
      // are neutral, and unresolved ordinary identifiers remain neutral.
      else if(next?.value==='(' && prev?.value==='.' && resolve(code[i-2]?.value)) annotations.set(t.start,[{kind:'function',value:t.value}]);
      else annotations.set(t.start,[{kind:'plain',value:t.value}]);
    }
    if(scalarConsumer || uncertainCall){vector=false;rank=0;axes.clear();}
    rank=Math.max(rank,axes.size);
    const reduction=/^(?:[A-Za-z_]\w*\.)?(?:min|max|ptp|sum|mean|count|variance|std|median|percentile|iqr|mode)_([a-z]{1,3})\(/.exec(rhsText);
    if(reduction){
      const argumentRanks=rhs.filter(t=>t.kind==='identifier').map(t=>resolve(t.value)?.rank??0);
      rank=Math.max(0,...argumentRanks)-reduction[1].length;
      rank=Math.max(0,rank);vector=rank>0;
      for(const axis of reduction[1])axes.delete(axis);
    }
    if(functionName) current.symbols.set(functionName,{callable:true,vector:false});
    if(binding){
      const entry={vector,module:rhs[0]?.value==='.'?rhs[1]?.value:null,rank:vector?Math.max(1,rank):0,axes,callable:Boolean(resolve(rhs[0]?.value)?.callable && rhs[1]?.value==='[')};
      current.symbols.set(binding.value,entry);
      axisBinding(binding.value,entry,current.symbols);
      if(/:\s*$/.test(line))scopes.push({indent,symbols:new Map(),parentBinding:entry,bindingName:binding.value,vector:false,rank:0,axes:new Set()});
    } else {current.vector=vector;current.rank=rank;current.axes=axes;}
    if(!functionName && !binding && /(?:\?>|\?\?>|\?|>>|=>)\s*$/.test(line)) scopes.push({indent,symbols:new Map(),parentBinding:null,vector:false,rank:0,axes:new Set()});
    if(functionName && !line.slice(definitionEnd-offset).trim())scopes.push({indent,symbols:introduced,parentBinding:null,vector:false,rank:0,axes:new Set()});
    // Parameters are visible in a one-line body without escaping its scope.
    offset+=line.length+1;
  }
  while(scopes.length>1)close();
  return raw.flatMap(t=>annotations.get(t.start)??[{kind:t.kind==='identifier'?'plain':t.kind,value:t.value}]);
}
