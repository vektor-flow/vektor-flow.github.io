// Execution adapter for compiler-owned numeric field artifacts. All numerical
// transformations reside in generated VKF shaders, never in this transport layer.
export async function createCompiledFieldKernel(device, code, manifest) {
  if (manifest.backend !== 'compiler-owned-canonical-typed-ir-wgsl-real-f32' ||
      manifest.workgroup_size !== 64 ||
      manifest.schema !== 'vektor-flow/compiled-wgsl-field-candidate/1' ||
      manifest.error_summary_clear_before_dispatch !== true) throw new Error('Unsupported compiled field ABI');
  const outputStorage=manifest.output_storage||'f32';
  if(!['f32','u32'].includes(outputStorage)||manifest.bindings?.[2]!==`results:write-${outputStorage}`)throw Error('Unsupported compiled output storage');
  const outputWidth=manifest.output_width;
  if(!Number.isInteger(outputWidth)||outputWidth<1||outputWidth>256)throw new Error('Invalid compiled field output packet');
  const dynamic = manifest.dispatch_count_mode === 'result-buffer-length';
  const fixed = manifest.dispatch_count_mode === 'fixed';
  if ((!dynamic && !fixed) || (dynamic && (manifest.dispatch_count !== 0 ||
      manifest.errors_required_elements !== 'invocation-count+1' ||
      manifest.error_summary_offset !== 'invocation-count*4')) ||
      (fixed && (!Number.isInteger(manifest.dispatch_count) || manifest.dispatch_count < 1 ||
      manifest.errors_required_elements !== manifest.dispatch_count+1 ||
      manifest.error_summary_offset !== manifest.dispatch_count*4))) {
    throw new Error('Compiled field error ABI mismatch');
  }
  const module = device.createShaderModule({code});
  const info = await module.getCompilationInfo();
  const failures = info.messages.filter(message => message.type === 'error');
  if (failures.length) throw new Error(failures.map(x => x.message).join('\n'));
  const groupLayout = device.createBindGroupLayout({entries:[0,1,2,3].map(binding => ({
    binding, visibility:GPUShaderStage.COMPUTE,
    buffer:{type:binding < 2 ? 'read-only-storage' : 'storage'}
  }))});
  const pipeline = await device.createComputePipelineAsync({
    layout:device.createPipelineLayout({bindGroupLayouts:[groupLayout]}),
    compute:{module,entryPoint:'vkf_field'}
  });
  return Object.freeze({
    bind({params,values,result,errors,count}) {
      if (!Number.isInteger(count) || count < 1 || result.size !== count*outputWidth*4 ||
          errors.size < (count+1)*4 || params.size < 4 || values.size < 4) {
        throw new RangeError('Invalid compiled field buffers');
      }
      if (manifest.dispatch_count !== 0 && manifest.dispatch_count !== count) {
        throw new RangeError('Compiled field dispatch size mismatch');
      }
      if (params===result || values===result || params===errors || values===errors || result===errors) {
        throw new Error('Compiled field outputs must not alias inputs');
      }
      const groups = Math.ceil(count/64);
      if (groups > device.limits.maxComputeWorkgroupsPerDimension) {
        throw new RangeError('Compiled field exceeds device dispatch limit');
      }
      const group = device.createBindGroup({layout:groupLayout,entries:
        [params,values,result,errors].map((buffer,binding)=>({binding,resource:{buffer}}))});
      const dispatch=(pass,invocations=count)=>{
        if(!Number.isInteger(invocations)||invocations<0||invocations>count)throw new RangeError('Invalid active invocation count');
        pass.setPipeline(pipeline);pass.setBindGroup(0,group);
        pass.dispatchWorkgroups(Math.ceil(invocations/64));
      };
      const dispatchIndirect=(pass,buffer,offset=0)=>{
        if(!buffer||!(buffer.usage&GPUBufferUsage.INDIRECT)||!Number.isSafeInteger(offset)||offset<0||offset%4||buffer.size<offset+12)throw new RangeError('Invalid indirect dispatch buffer');
        pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroupsIndirect(buffer,offset);
      };
      return Object.freeze({count,summaryOffset:count*4,dispatch,dispatchIndirect,encode(encoder, timestampWrites) {
        const pass = encoder.beginComputePass(timestampWrites ? {timestampWrites} : {});
        dispatch(pass);pass.end();
      }});
    }
  });
}

export function createFieldBuffer(device, dataOrCount, extraUsage=0) {
  const data = ArrayBuffer.isView(dataOrCount) ? dataOrCount : null;
  const size = data ? data.byteLength : dataOrCount*4;
  if (!Number.isSafeInteger(size) || size < 4 || size%4) throw new RangeError('Invalid field buffer size');
  const buffer=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|
    GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|extraUsage});
  if(data)device.queue.writeBuffer(buffer,0,data);
  return buffer;
}
