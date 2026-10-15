// Import expressions, never execute TeX or discard unsupported commands silently.
export function splitSteps(input){
 if(typeof input!=='string'||input.length>12000)throw Error('Keep morph input under 12,000 characters. Use Document for larger files.');
 const text=input.replace(/(?<!\\)%[^\n]*/g,'');
 const blocks=[];const re=/\\begin\{(align\*?|aligned|equation\*?|gather\*?|gathered|multline\*?)\}([\s\S]*?)\\end\{\1\}|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g;
 for(const match of text.matchAll(re))blocks.push(match[2]??match[3]??match[4]);
 if(!blocks.length){if(/\\(?:documentclass|begin\{document\})/.test(text)){for(const m of text.matchAll(/(?<!\\)\$([^$]+)(?<!\\)\$/g))blocks.push(m[1]);if(!blocks.length)throw Error('No math steps found. Add display equations or an align block.');}else blocks.push(text);}
 const plain=!blocks.length || (!/\\(?:begin\{|\[)|\$\$/.test(text) && !/\\documentclass/.test(text));
 const steps=[];
 for(const block of blocks){let row='',braces=0,environments=0;const tokens=block.match(/\\begin\{[^}]+\}|\\end\{[^}]+\}|\\\\(?:\[[^\]]*\])?|\\[\s\S]|[\s\S]/g)||[];
  for(const token of tokens){if(token.startsWith('\\begin{'))environments++;if(token.startsWith('\\end{'))environments--;if(token==='{')braces++;if(token==='}')braces--;
   if(braces===0&&environments===0&&(token.startsWith('\\\\')||(plain&&token==='\n'))){if(row.trim())steps.push(row.trim());row='';}
   else if(token==='&'&&environments===0&&braces===0){}else row+=token;
  }if(row.trim())steps.push(row.trim());
 }
 const cleaned=steps.map(s=>s.replace(/^\$|\$$/g,'').replace(/\\(?:notag|nonumber)\b/g,'').trim()).filter(Boolean);
 if(!cleaned.length||cleaned.length>24)throw Error('Use 1–24 worked steps. Each top-level row is one step.');return cleaned;
}
