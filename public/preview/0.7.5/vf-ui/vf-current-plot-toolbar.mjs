import {mountPlotToolbar} from './vf-plot-toolbar.mjs?sha256=3c5af61acf193f8c2824acacbe17bfe83707b493e58b890532872b62870edb39';
import {createPlotDocking} from './vf-plot-docking.mjs?sha256=2d937dc67282c6305305905b0546b36205a3112e018ab40647f3cac2e0022fe3';
import {createSceneMediaCapture,createLayeredCanvasCaptureStream} from './vf-media-capture.mjs?sha256=5a8d44e043e379f22c8bbdaeb86f91690f083acea7b306302ffd937ac7643306';

// Uses the renderer's own bounded history and physical canvas capture.
// Callers supply playback only when their runtime can actually control time.
export function mountCurrentPlotToolbar(frame, scene, {
  document=globalThis.document, VfDisplay=globalThis.VfDisplay,
  host=frame?.root, animation={timed:false},
}={}) {
  const root=frame?.root,body=frame?.body;
  if (!root || !body || !host || scene.toolbar === false) return ()=>{};
  const toolbarCleanup=[];
    const dispatch=command=>body.dispatchEvent(new CustomEvent("vf-view-command",{bubbles:true,cancelable:true,detail:{command}}));
    const subscriptions=new Set();
    const historyState=()=>({canBack:body.__vfViewHistory?.canBack?.()===true,canForward:body.__vfViewHistory?.canForward?.()===true});
    // Reuse the existing bounded renderer history, including its restore path.
    // First/last never reset the data domain or create a second history.
    const move=command=>{dispatch(command);return body.__vfViewHistory?.current?.() ?? null;};
    const edge=command=>{let count=0,value=null;while(historyState()[command === 'back' ? 'canBack' : 'canForward']) {
      if (++count>100) throw new Error('PLOT_RENDERER_HISTORY_BOUND');value=move(command);
    }return value;};
    const history={state:historyState,current:()=>body.__vfViewHistory?.current?.() ?? null,
      back:()=>historyState().canBack ? move('back') : null,forward:()=>historyState().canForward ? move('forward') : null,
      first:()=>edge('back'),last:()=>edge('forward'),subscribe(fn){subscriptions.add(fn);return()=>subscriptions.delete(fn);}};
    const historyChanged=()=>{for (const fn of subscriptions) fn(historyState());};
    root.addEventListener('vf-view-history-state',historyChanged);
    toolbarCleanup.push(()=>root.removeEventListener('vf-view-history-state',historyChanged));
    const fid=scene.frame;
    const download=(bytes,type,name)=>{
      const url=URL.createObjectURL(new Blob([bytes],{type})),anchor=document.createElement('a');
      anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),0);
    };
    const media=createSceneMediaCapture({requestStream:()=>createLayeredCanvasCaptureStream({document,
      layers:[()=>VfDisplay.captureGeomFrameCanvas(fid)]})});
    const video={get recording(){return media.recording;},start:()=>media.startMovie(),async stop(){
      const blob=await media.stopMovie();if (!blob) throw new Error('PLOT_VIDEO_CAPTURE_EMPTY');
      download(new Uint8Array(await blob.arrayBuffer()),blob.type,'vektor-flow-view.webm');return blob;
    }};
    const canvasCapture=(scene.meshes || []).length>0 && (scene.meshes || []).every(mesh=>mesh.mode3d === false);
    const capture={formats:canvasCapture ? ['png'] : [],video:canvasCapture && typeof document.defaultView?.MediaRecorder === 'function' ? video : null,
      async frame(){
        const url=await VfDisplay.captureGeomFrameDataUrl(fid);if (!url) throw new Error('PLOT_PNG_CAPTURE_UNAVAILABLE');
        const bytes=new Uint8Array(await(await fetch(url)).arrayBuffer());
        return {formats:['png'],save(format){if(format !== 'png') throw new Error('PLOT_CAPTURE_FORMAT_UNAVAILABLE');return bytes;}};
      },save({format,bytes}){download(bytes,'image/png','vektor-flow-view.'+format);}};
    const originalClass=host.classList.contains('vf-plot-host');
    host.classList.add('vf-plot-host');body.classList.add('vf-plot-frame');
    const phone=document.defaultView?.matchMedia?.('(max-width:480px)');
    const docking=createPlotDocking({position:scene.toolbarPosition ?? (typeof scene.toolbar === 'string' ? scene.toolbar : 'top'),
      inset:scene.inset !== false,phone:phone?.matches === true,onChange:applyDock});
    function applyDock(state) {
      host.dataset.toolbarDock=state.dock;host.dataset.toolbarInset=String(state.inset);
      // Inset chrome overlays the existing complete plot viewport. Only the
      // explicit non-inset option may consume a layout row/column.
      if (host !== body) {
        body.style.position=state.inset ? 'absolute' : 'relative';
        body.style.inset=state.inset ? '0' : 'auto';
      }
      VfDisplay.requestGeomFramePresentation?.(fid);
    }
    applyDock(docking.snapshot());
    const toolbar=mountPlotToolbar(host,{history,docking,capture,
      animation,
      zoom:factor=>dispatch(factor<1 ? 'zoom-in' : 'zoom-out'),
      onDockPreview:edge=>{if(edge)root.dataset.dockPreview=edge;else delete root.dataset.dockPreview;},
      onError:error=>{root.dispatchEvent(new CustomEvent('vf-plot-toolbar-error',{bubbles:true,detail:{message:error.message}}));}
    });
    const refresh=()=>toolbar.refresh();root.addEventListener('vf-view-animation-state',refresh);
    const appearance=document.defaultView?.matchMedia?.('(prefers-color-scheme:dark)');
    const theme=()=>{const selected=document.documentElement.dataset.theme;toolbar.element.dataset.theme=['light','dark'].includes(selected) ? selected : appearance?.matches ? 'dark' : 'light';};
    theme();appearance?.addEventListener?.('change',theme);const themeObserver=typeof MutationObserver === 'function' ? new MutationObserver(theme) : null;
    themeObserver?.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    const phoneChanged=()=>docking.setPhone(phone.matches);phone?.addEventListener?.('change',phoneChanged);
    toolbarCleanup.push(()=>{root.removeEventListener('vf-view-animation-state',refresh);themeObserver?.disconnect();appearance?.removeEventListener?.('change',theme);phone?.removeEventListener?.('change',phoneChanged);
      media.cancel();void toolbar.close();body.classList.remove('vf-plot-frame');if(!originalClass)host.classList.remove('vf-plot-host');});
  let closed=false;
  return ()=>{if(closed)return;closed=true;for(const cleanup of toolbarCleanup)cleanup();};
}
