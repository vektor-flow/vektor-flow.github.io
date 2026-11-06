import {createSymbolicKernel} from '../vf-symbolic-kernel-runtime.mjs';
let currentModule,currentManifest,catalog,fonts,tableKernel,tableInstance,plans=[],glyphs,initialized=false,typesetCalls=0,layoutCalls=0;
const need=(ok,code)=>{if(!ok)throw Object.assign(Error(code),{code});};
const current=()=>createSymbolicKernel({instance:new WebAssembly.Instance(currentModule,{}),manifest:currentManifest,diagnostics:true});
function typeset(source){typesetCalls++;const box=JSON.parse(current().invokeValue('math_layout',[source,catalog,true,true,false,1]));need(box.complete===true&&box.diagnostics?.length===0,'NATIVE_TABLE_INCOMPLETE_GLYPH');return box;}
self.onmessage=async({data})=>{try{
 if(data.type==='initialize'){
  need(!initialized,'NATIVE_TABLE_ALREADY_INITIALIZED');currentModule=await WebAssembly.compile(data.currentWasm);need(!WebAssembly.Module.imports(currentModule).length,'NATIVE_TABLE_HOST_IMPORTS');currentManifest=data.currentManifest;catalog=data.catalog;
  const tableModule=await WebAssembly.compile(data.tableWasm);need(!WebAssembly.Module.imports(tableModule).length,'NATIVE_TABLE_HOST_IMPORTS');tableInstance=new WebAssembly.Instance(tableModule,{});tableKernel=createSymbolicKernel({instance:tableInstance,manifest:data.tableManifest,diagnostics:true});
  need(currentManifest.functions.__vkf_module_parser__parse?.parameters===3&&currentManifest.functions.__vkf_module_layout__layout?.parameters===12,'NATIVE_TABLE_CURRENT_LAYOUT_ABI');initialized=true;self.postMessage({id:data.id,status:'ok'});return;
 }
 need(initialized,'NATIVE_TABLE_NOT_INITIALIZED');
 if(data.type==='prepare'){
  need(!plans.length,'NATIVE_TABLE_ALREADY_PREPARED');const started=performance.now();fonts=current().invokeValue('__vkf_module_catalog__load',[catalog]);
  glyphs=[...'0123456789.-'].map(typeset);need(glyphs.every(b=>b.items.length===1&&b.items[0].kind==='glyph'&&(b.items[0].sx??1)===1&&(b.items[0].sy??1)===1&&!b.items[0].clip&&!b.items[0].crop&&b.width>0),'NATIVE_TABLE_DIGIT_PROFILE');need(glyphs.slice(0,10).every(box=>box.width===glyphs[0].width),'NATIVE_TABLE_FIXED_DIGIT_ADVANCES');
  const cache=new Map(),prepared=[];
  for(const table of data.tables){const ids=table.rows.map(r=>r.id),lower=table.rows.map(r=>r.min),upper=table.rows.map(r=>r.max),precision=table.rows.map(r=>r.precision),labels=table.rows.map(r=>r.label),reserves=tableKernel.invokeValue('reserves',[lower,upper,precision]);
   const widths=reserves.map(source=>{if(!cache.has(source))cache.set(source,typeset(source));return cache.get(source).width;}),source=tableKernel.invokeValue('source',[labels,lower,upper,precision]),arena=current().invokeValue('__vkf_module_parser__parse',[source,fonts,true]);need(arena.diagnostics==='','NATIVE_TABLE_PARSE_DIAGNOSTIC');
   const scene=current().invokeValue('__vkf_module_layout__layout',[arena,fonts,true,true,false,1,false,'','',-1,false,'']);layoutCalls++;need(scene.diagnostics==='','NATIVE_TABLE_LAYOUT_DIAGNOSTIC');
   const plan=tableKernel.invokeValue('prepare',[arena,scene,ids,lower,upper,precision,widths,glyphs.map(b=>b.items[0].key),glyphs.map(b=>b.width),glyphs.map(b=>b.items[0].x),glyphs.map(b=>b.items[0].y)]);plans.push(plan);
   prepared.push({id:table.id,source,width:plan.width,height:plan.height,depth:plan.depth,staticItems:JSON.parse(plan.static_items),cells:ids.map((id,i)=>({id,owner:plan.owners[i],right:plan.right[i],baseline:plan.baseline[i],reserveWidth:widths[i],precision:precision[i],min:lower[i],max:upper[i],reserve:reserves[i]}))});
  }
  fonts=null;catalog=null;self.postMessage({id:data.id,status:'ok',tables:prepared,glyphMetrics:glyphs,preparationMs:performance.now()-started,typesetCalls,layoutCalls,heap:tableInstance.exports.vkf_vm_heap_ptr()});return;
 }
 if(data.type==='sample'){
  need(data.values.length===plans.length,'NATIVE_TABLE_VALUE_ARITY');const started=performance.now(),frames=plans.map((plan,i)=>tableKernel.invokeValue('sample',[plan,data.values[i]]));self.postMessage({id:data.id,status:'ok',frames,nativeComputeMs:performance.now()-started,typesetCalls,layoutCalls,heap:tableInstance.exports.vkf_vm_heap_ptr()});return;
 }
 throw Object.assign(Error('NATIVE_TABLE_REQUEST'),{code:'NATIVE_TABLE_REQUEST'});
}catch(error){self.postMessage({id:data.id,status:'error',error:{code:error.code??'NATIVE_TABLE_NATIVE_ERROR',message:String(error.message??error)}});}};
