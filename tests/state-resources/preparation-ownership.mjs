import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadNativeStateKernel} from '../../public/preview/0.7.5/vf-ui/native-labels/vf-state-interpolation.mjs';
const fixture=JSON.parse(await fs.readFile(new URL('./native-gc-fixture.json',import.meta.url),'utf8'));
const fetch=async url=>new Response(await fs.readFile(url));
const loaded=await loadNativeStateKernel({fetch});
const args=fixture.geometry;
const expected=loaded.preparationKernel.invokeValue('prepare_geometry',args);
const retained=loaded.kernel.invoke('prepare',[[0,1],[1,2,4,8],2,0,false,false]);
for(let i=0;i<4;i++){
 loaded.preparationKernel.invokeValue('contour_field',fixture.contour);
 assert.deepEqual(loaded.preparationKernel.invokeValue('prepare_geometry',args),expected);
 assert.deepEqual(loaded.kernel.invokeValue('sample',[retained.handle,.5]).value,[2.5,5]);
}
assert.equal(loaded.preparationStatistics().calls,9);
const result={passed:true,libraryCommit:loaded.provenance.libraryCommit,actualContourGeometrySequences:4,completePlansExact:true,retainedStateHandleSurvives:true,ownership:loaded.preparationStatistics(),scope:'Detached values only; general retained kernel APIs are unchanged. No shared-kernel GC fix claim.'};
await fs.writeFile(new URL('../../docs/state-resources/PREPARATION-OWNERSHIP.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
