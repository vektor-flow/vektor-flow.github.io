import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const library=process.argv[2];if(!library)throw Error('Usage: node scripts/prepare-math-derivations.mjs LIBRARY_DIRECTORY');
const source=path.resolve(library,'derivations.mjs'),{derivations}=await import(pathToFileURL(source));
const root='public/previews/gpu-math-typing';fs.copyFileSync(source,`${root}/examples/derivation-data.mjs`);
const out=`${root}/examples/downloads/math`;fs.mkdirSync(out,{recursive:true});
for(const e of derivations){const lines=['\\documentclass{article}','\\usepackage{amsmath,amssymb}','\\begin{document}',`% ${e.title}`,`% Assumptions: ${e.assumptions}`];for(const s of e.steps)lines.push(`% ${s.note}`,'\\[',s.math,'\\]');lines.push('\\end{document}','');fs.writeFileSync(`${out}/${e.id}.tex`,lines.join('\n'));}
fs.writeFileSync(`${out}/derivations.json`,JSON.stringify(derivations,null,2)+'\n');
console.log(`Prepared ${derivations.length} derivations and ${derivations.reduce((n,e)=>n+e.steps.length,0)} annotated steps`);
