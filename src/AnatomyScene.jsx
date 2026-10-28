import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { damp, revealState, layerBlend, revealMode } from './reveal.mjs';
import { followLink, routeHref } from './navigation.mjs';
import { LayerBlendRenderer } from './LayerBlendRenderer.mjs';
import { DensityReveal, attachDensityField } from './DensityReveal.mjs';
import { DensityRenderer, densityPixelRatio } from './DensityRenderer.mjs';
import { registerAnatomyPoint } from './registration.mjs';
import { sections, sectionById, overviewView } from './content/portfolio.mjs';
import { layoutHotspots } from './hotspots.mjs';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export const AnatomyScene = forwardRef(function AnatomyScene(props, ref) {
  const host = useRef(null), engine = useRef(null), live = useRef(props), markers = useRef({}), leaders=useRef({}), dots=useRef({});
  const [status, setStatus] = useState('loading'), [progress, setProgress] = useState(0);
  live.current = props;
  useImperativeHandle(ref, () => ({ reset: () => engine.current?.reset(), zoom: d => engine.current?.zoom(d), stopMotion: () => engine.current?.stopMotion(), focusSection: id=>engine.current?.focusSection(id), getView:()=>engine.current?.getView(), getCanvas:()=>engine.current?.canvas, setFocusViewport:value=>engine.current?.setFocusViewport(value), startBrainSlice:options=>engine.current?.startBrainSlice(options), extractBrainSlice:value=>engine.current?.brainSlice?.extract(value), closeBrainSlice:options=>engine.current?.closeBrainSlice(options), abortBrainSlice:()=>engine.current?.abortBrainSlice(), focusZoom:direction=>engine.current?.brainSlice?.zoom(direction), focusReset:()=>engine.current?.brainSlice?.reset(), focusRotate:(x,y)=>engine.current?.brainSlice?.rotate(x,y), hitBrainSlice:(x,y)=>engine.current?.hitBrainSlice(x,y) }), []);
  useEffect(() => {
    const container = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { setStatus('unsupported'); return; }
    let cancelled = false, frame = 0, last = 0, currentReveal = live.current.reveal, destination = null, wasView = live.current.activeChapter||(live.current.exploring?'atlas':'home');
    const mode=revealMode(location.search),sectional=mode==='section';
    const density=mode==='density'?new DensityReveal():null;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
    if(!density)renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
    const canvas = renderer.domElement;
    canvas.setAttribute('role', 'img'); canvas.tabIndex = 0;canvas.dataset.atlasCanvas='true';
    canvas.setAttribute('aria-label', 'Interactive 3D avatar of Arush with illustrative internal anatomy. Drag to rotate; scroll or pinch to zoom. Arrow keys rotate, plus and minus zoom, Home resets.');
    container.prepend(canvas);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 50);
    const start = new THREE.Vector3(2.1, 1.3, 6.7); camera.position.copy(start);
    const initialView=sectionById[live.current.activeChapter]?.view||(live.current.exploring?overviewView:null);
    if(initialView)camera.position.fromArray(initialView.position);
    const controls = new OrbitControls(camera, canvas);
    controls.target.fromArray(initialView?.target||[0,.55,0]); controls.enableDamping = true; controls.dampingFactor = 0.075;
    controls.enablePan = false; controls.minDistance = 2.5; controls.maxDistance = 10;
    controls.minPolarAngle = Math.PI * .18; controls.maxPolarAngle = Math.PI * .82;
    controls.rotateSpeed = .55; controls.zoomSpeed = .65; controls.autoRotateSpeed = .28; controls.update();
    const cancelPendingView=()=>{destination=null;wasView=live.current.activeChapter||(live.current.exploring?'atlas':'home');};
    controls.addEventListener('start', () => { cancelPendingView(); live.current.onInteraction(); });
    scene.add(new THREE.HemisphereLight(0xfff3dc, 0x302a27, 1.5));
    [[0xffeed7, 3.1, 4, 6, 7], [0xffffff, 1.5, -5, 2, 3], [0xf5e5cf, 2.2, 2, 4, -4]].forEach(([color,intensity,x,y,z]) => {
      const light = new THREE.DirectionalLight(color, intensity); light.position.set(x,y,z); scene.add(light);
    });
    const materials = {
      avatar: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, alphaHash: true, opacity: 1 }),
      bone: new THREE.MeshStandardMaterial({ color: '#b9a884', roughness: .77, alphaHash: true, opacity: 0 }),
      arteries: new THREE.MeshStandardMaterial({ color: '#bf0d09', roughness: .48, alphaHash: true, opacity: 0 }),
      brain: new THREE.MeshStandardMaterial({ color: '#bc796e', roughness: .88, alphaHash: true, opacity: 0 }),
    };
    if(density){materials.bone.color.set('#d5c9b0');materials.bone.roughness=.5;materials.arteries.roughness=.34;materials.brain.roughness=.72;}
    const anatomy = new THREE.Group(); scene.add(anatomy);
    const avatarMaterials = new Set();
    const cutUniform = {value: revealState(currentReveal).cut};
    const boneCut = {value: revealState(currentReveal).boneCut}, brainCut={value: revealState(currentReveal).brainCut};
    // Complementary section masks avoid blending two differently shaped faces.
    // Alpha hashing feathers only the narrow boundary and keeps depth-writing on.
    const section = (material, name) => {
      if(density){density.install(material,name);return;}
      material.transparent=false; material.alphaHash=sectional; material.depthWrite=true;
      if(!sectional)return;
      material.onBeforeCompile=shader=>{
        shader.uniforms.revealCut=name==='arteries'?boneCut:name==='brain'?brainCut:cutUniform;
        shader.uniforms.exitCut=boneCut;
        shader.vertexShader='varying float sectionY;\n'+shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nsectionY=(modelMatrix*vec4(transformed,1.0)).y;');
        shader.fragmentShader='varying float sectionY;\nuniform float revealCut;\nuniform float exitCut;\n'+shader.fragmentShader.replace('#include <alphahash_fragment>', `diffuseColor.a *= ${name==='avatar' ? '1.0 - ' : ''}smoothstep(revealCut-.025,revealCut+.025,sectionY);\n${name==='bone'?'diffuseColor.a *= 1.0-smoothstep(exitCut-.025,exitCut+.025,sectionY);':''}\n#include <alphahash_fragment>`);
      };
      material.customProgramCacheKey=()=>`section-${name}`;
    };
    for(const name of ['bone','arteries','brain']){section(materials[name],name);materials[name].opacity=1;}
    const models = {}, draco = new DRACOLoader().setDecoderPath('/draco/');
    const loader = new GLTFLoader().setDRACOLoader(draco); let completed = 0;
    const blender=mode==='blend'?new LayerBlendRenderer(renderer,scene,camera,models):null;
    const densityRenderer=density?new DensityRenderer(renderer,scene,camera,models,density):null;
    const modelReadiness=Promise.all(Object.keys(materials).map(async name => {
      const [gltf,weights]=await Promise.all([
        loader.loadAsync(`/models/${name}.glb`),
        density&&['bone','arteries'].includes(name)?fetch(`/models/density/${name}.bin`).then(async response=>{if(!response.ok)throw new Error('Density weights unavailable');return new Uint16Array(await response.arrayBuffer());}):null,
      ]);
      if(cancelled){ gltf.scene.traverse(o => o.geometry?.dispose()); return; }
      let offset=0;
      gltf.scene.traverse(o => { if(o.isMesh){
        if(density){
          const count=o.geometry.attributes.position.count;
          if(weights){if(offset+count>weights.length)throw new Error('Density weight/mesh mismatch');o.geometry.setAttribute('revealDensity',new THREE.Uint16BufferAttribute(weights.subarray(offset,offset+count),1,true));offset+=count;}
          else o.geometry.setAttribute('revealDensity',new THREE.Uint8BufferAttribute(new Uint8Array(count).fill(128),1,true));
        }
        // Register every internal layer using the same coordinates/landmarks.
        if(name !== 'avatar'){
          const positions=o.geometry.attributes.position;
          for(let i=0;i<positions.count;i++)positions.setXYZ(i,...registerAnatomyPoint(positions.getX(i),positions.getY(i),positions.getZ(i)));
          positions.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere();o.geometry.computeBoundingBox();
        }
        if(density){o.updateWorldMatrix(true,false);attachDensityField(o.geometry,o.matrixWorld);}
        if(name === 'avatar'){
          for(const material of Array.isArray(o.material)?o.material:[o.material]){
            section(material,'avatar');material.side=THREE.FrontSide;avatarMaterials.add(material);
          }
        }else{o.material.dispose();o.material=materials[name];}
        o.renderOrder = 0;
      } });
      if(weights&&offset!==weights.length)throw new Error('Unused density weights: model changed');
      gltf.scene.userData.sectionBounds=new THREE.Box3().setFromObject(gltf.scene);
      models[name] = gltf.scene; anatomy.add(gltf.scene); setProgress(++completed / 4);needsRender=true;
    })).then(async () => { if(!cancelled){await densityRenderer?.prepare();if(!cancelled){needsRender=true;setStatus('ready');live.current.onReady();return true;}}return false; }).catch(e => {
      if(!cancelled){ console.error('Anatomy loading failed', e); setStatus('error'); }return false;
    });
    const anchors=Object.fromEntries(sections.map(section=>[section.id,registerAnatomyPoint(...section.anchor)]));
    const projected = new THREE.Vector3();
    const drawnPosition=new THREE.Vector3(),drawnRotation=new THREE.Quaternion();
    let needsRender=true,drawnReveal=-1,lastRevealTarget=live.current.reveal,brainSlice=null,focusViewport=null,focusGeneration=0;
    if(import.meta.env.DEV)canvas.__atlas={camera,controls,models,scene,renderer,density,densityRenderer,get reveal(){return currentReveal;},get brainSlice(){return brainSlice;}};
    const resize = () => { const {width,height} = focusViewport||container.getBoundingClientRect(); if(!width || !height)return; needsRender=true;if(density)renderer.setPixelRatio(densityPixelRatio(width,height,devicePixelRatio,matchMedia('(max-width:760px)').matches));renderer.setSize(width,height); camera.aspect=width/height; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const flyTo=view=>{stopMotion();destination={camera:new THREE.Vector3().fromArray(view.position),target:new THREE.Vector3().fromArray(view.target)};};
    const reset = () => flyTo({position:start.toArray(),target:[0,.55,0]});
    const focusSection=id=>{const view=sectionById[id]?.view;if(view)flyTo(view);};
    const rotate = d => { cancelPendingView(); live.current.onInteraction(); const offset=camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0), d*.16); camera.position.copy(controls.target).add(offset); controls.update(); };
    const zoom = d => { cancelPendingView(); live.current.onInteraction(); const offset=camera.position.clone().sub(controls.target).multiplyScalar(d>0?.9:1.1).clampLength(2.5,10); camera.position.copy(controls.target).add(offset); controls.update(); };
    const keydown = e => {
      if(brainSlice)return;
      if(['ArrowLeft','ArrowRight','+','=','-','Home'].includes(e.key))e.preventDefault();
      if(e.key==='ArrowLeft')rotate(-1); if(e.key==='ArrowRight')rotate(1);
      if(e.key==='+'||e.key==='=')zoom(1); if(e.key==='-')zoom(-1); if(e.key==='Home')live.current.onReset();
    };
    const stopMotion=()=>{
      cancelPendingView();controls.autoRotate=false;
      // Drain OrbitControls inertia while preserving this exact viewing angle.
      const position=camera.position.clone(),target=controls.target.clone();
      controls.enableDamping=false;controls.update(0);
      camera.position.copy(position);controls.target.copy(target);controls.update(0);
      controls.enableDamping=true;
      if(completed===4)densityRenderer?.prime();
    };
    const getView=()=>{const {left,top,width,height}=container.getBoundingClientRect();return {position:camera.position.toArray(),target:controls.target.toArray(),viewport:{left,top,width,height}};};
    const abortBrainSlice=()=>{focusGeneration++;if(brainSlice){brainSlice.dispose();brainSlice=null;delete canvas.__brainSlice;densityRenderer?.invalidate();needsRender=true;}};
    const startBrainSlice=async({onReady,onFocused}={})=>{
      const generation=++focusGeneration;stopMotion();
      const loaded=await modelReadiness;if(generation!==focusGeneration||cancelled)return;
      if(!loaded){onReady?.(false);onFocused?.();return;}
      try{
        const {BrainSliceController}=await import('./BrainSliceController.mjs');
        if(generation!==focusGeneration||cancelled)return;
        const controller=new BrainSliceController({renderer,scene,camera,controls,models,density,densityRenderer,materials,markDirty:()=>{needsRender=true;}});
        brainSlice=controller;
        if(import.meta.env.DEV)canvas.__brainSlice=controller;
        const supported=await controller.enter({onFocused});
        if(generation!==focusGeneration||cancelled){if(brainSlice===controller)abortBrainSlice();return;}
        onReady?.(supported);
      }catch(error){if(generation===focusGeneration&&!cancelled){console.error('Brain slice preparation failed',error);abortBrainSlice();onReady?.(false);onFocused?.();}}
    };
    const closeBrainSlice=({onReturned}={})=>{
      focusGeneration++;
      if(brainSlice&&brainSlice.phase!=='preparing'&&brainSlice.phase!=='idle')brainSlice.close({onReturned:()=>{abortBrainSlice();onReturned?.();}});
      else{abortBrainSlice();onReturned?.();}
    };
    const raycaster=new THREE.Raycaster(),slicePointer=new THREE.Vector2();
    const hitBrainSlice=(x,y)=>{
      if(brainSlice?.phase!=='focused')return false;
      const rect=canvas.getBoundingClientRect();slicePointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);raycaster.setFromCamera(slicePointer,camera);
      return Boolean(brainSlice.sliceTarget&&raycaster.intersectObject(brainSlice.sliceTarget,false).length||brainSlice.slab?.visible&&raycaster.intersectObject(brainSlice.slab,true).length);
    };
    canvas.addEventListener('keydown',keydown); engine.current={reset,zoom,stopMotion,focusSection,getView,canvas,startBrainSlice,closeBrainSlice,abortBrainSlice,hitBrainSlice,setFocusViewport:value=>{if(!value&&!focusViewport)return;if(value&&focusViewport&&value.width===focusViewport.width&&value.height===focusViewport.height)return;focusViewport=value;resize();},get brainSlice(){return brainSlice;}};
    const render = time => {
      if(cancelled)return; frame=requestAnimationFrame(render); if(time-last<1000/60-1)return;
      const elapsed=Math.max(0,(time-last)/1000),dt=Math.min(elapsed,.1);last=time;const p=live.current;
      const viewKey=p.activeChapter||(p.exploring?'atlas':'home');
      if(viewKey!==wasView){
        wasView=viewKey;
        if(p.activeChapter)focusSection(p.activeChapter);else if(p.exploring)flyTo(overviewView);else reset();
      }
      const description=p.activeChapter?`Selected view: ${sectionById[p.activeChapter].region}`:'Whole-person overview';
      if(canvas.getAttribute('aria-description')!==description)canvas.setAttribute('aria-description',description);
      if(destination&&!brainSlice){
        const blend=reduced?1:1-Math.exp(-elapsed/.18);
        const from=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        const to=new THREE.Spherical().setFromVector3(destination.camera.clone().sub(destination.target));
        from.theta+=Math.atan2(Math.sin(to.theta-from.theta),Math.cos(to.theta-from.theta))*blend;
        from.phi=THREE.MathUtils.lerp(from.phi,to.phi,blend);from.radius=THREE.MathUtils.lerp(from.radius,to.radius,blend);
        controls.target.lerp(destination.target,blend);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(from));
        if(camera.position.distanceTo(destination.camera)<.012&&controls.target.distanceTo(destination.target)<.012){camera.position.copy(destination.camera);controls.target.copy(destination.target);destination=null;}
      }
      if(brainSlice)brainSlice.update(time);
      else{controls.autoRotate=p.spinning&&!reduced&&!destination;controls.update(dt);currentReveal=reduced?p.reveal:damp(currentReveal,p.reveal,elapsed);}
      const state=revealState(currentReveal);cutUniform.value=state.cut;
      boneCut.value=state.boneCut;brainCut.value=state.brainCut;
      // Cull only when a whole mesh is outside its section, including the
      // feather margin. This saves vertex work without a visible cutoff/pop.
      if(sectional)for(const [name,model] of Object.entries(models)){
        const {min,max}=model.userData.sectionBounds;
        model.visible=name==='avatar'?state.cut>min.y-.025:
          name==='bone'?state.cut<max.y+.025&&state.boneCut>min.y-.025:
          (name==='arteries'?state.boneCut:state.brainCut)<max.y+.025;
      }
      const viewChanged=needsRender || completed<4 || camera.position.distanceToSquared(drawnPosition)>1e-12 || 1-Math.abs(camera.quaternion.dot(drawnRotation))>1e-12;
      const labelsNeedLayout=sections.some(section=>markers.current[section.id]&&!markers.current[section.id].style.transform);
      if(viewChanged||labelsNeedLayout){
        // Project against this frame’s camera, including an instant section snap.
        camera.updateMatrixWorld(true);
        const w=container.clientWidth,h=container.clientHeight;
        const points=sections.flatMap(section=>{
          const marker=markers.current[section.id];if(!marker)return [];
          projected.fromArray(anchors[section.id]).project(camera);
          return [{id:section.id,side:section.callout.side,width:marker.offsetWidth,x:THREE.MathUtils.clamp((projected.x*.5+.5)*w,16,w-16),y:THREE.MathUtils.clamp((-projected.y*.5+.5)*h,16,h-16)}];
        });
        const labels=layoutHotspots(points,w,h);
        for(const point of points){
          const id=point.id,label=labels[id],marker=markers.current[id],dot=dots.current[id],leader=leaders.current[id];
          if(!label||!marker||!dot||!leader)continue;
          marker.style.transform=`translate(${label.x}px,${label.y}px)`;
          dot.style.transform=`translate(${point.x-label.x}px,${point.y-label.y}px)`;
          leader.setAttribute('x1',Math.max(label.x,Math.min(point.x,label.x+label.width)));leader.setAttribute('y1',label.y+22);
          leader.setAttribute('x2',point.x);leader.setAttribute('y2',point.y);
        }
      }
      // Avoid redrawing a half-million triangles while the scene is stationary.
      // Loading, resizing, orbiting and reveal movement all invalidate the frame.
      const revealMoving=Math.abs(drawnReveal-currentReveal)>.0001;
      const revealQualityMoving=p.reveal!==lastRevealTarget||Math.abs(currentReveal-p.reveal)>.005;
      lastRevealTarget=p.reveal;
      const cameraMoving=Boolean(destination)||Boolean(brainSlice&&brainSlice.phase!=='focused')||controls.autoRotate||camera.position.distanceToSquared(drawnPosition)>1e-8||1-Math.abs(camera.quaternion.dot(drawnRotation))>1e-8;
      if(viewChanged || revealMoving || densityRenderer?.needsRefinement){
        if(densityRenderer)densityRenderer.render(currentReveal,{moving:revealQualityMoving||cameraMoving});
        else if(blender){if(viewChanged)blender.invalidate();blender.render(layerBlend(currentReveal));}
        else renderer.render(scene,camera);
        needsRender=false;drawnReveal=currentReveal;
        drawnPosition.copy(camera.position);drawnRotation.copy(camera.quaternion);
      }
    };frame=requestAnimationFrame(render);
    return () => { cancelled=true;abortBrainSlice();cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('keydown',keydown);controls.dispose();draco.dispose();anatomy.traverse(o=>o.geometry?.dispose());const textures=new Set();for(const m of avatarMaterials){for(const slot of ['map','normalMap','roughnessMap','metalnessMap'])if(m[slot])textures.add(m[slot]);m.dispose();}textures.forEach(t=>t.dispose());Object.values(materials).forEach(m=>m.dispose());blender?.dispose();densityRenderer?.dispose();density?.dispose();renderer.dispose();canvas.remove();engine.current=null; };
  },[]);
  return <div className="anatomy-canvas" ref={host}>
    {status==='loading'&&<div className="model-loading" role="status"><span>Bringing the atlas into view</span><progress max="1" value={progress}/></div>}
    {status==='error'&&<div className="model-loading" role="alert"><p>The anatomy couldn’t load.</p><button onClick={()=>location.reload()}>Try again</button></div>}
    {status==='unsupported'&&<div className="model-loading" role="alert"><p>This browser could not start the 3D view.</p><a href={routeHref('/projects',location.search)} onClick={event=>followLink(event,routeHref('/projects',location.search),props.onNavigate)}>Explore the work</a></div>}
    {status==='ready'&&props.exploring&&<div className="model-markers" aria-label="Explore portfolio sections">
      <svg className="marker-leaders" aria-hidden="true">{sections.map(section=><line key={section.id} ref={el=>{leaders.current[section.id]=el;}}/>)}</svg>
      {sections.map(section=><a href={routeHref('/'+section.id,location.search)} key={section.id} ref={el=>{markers.current[section.id]=el;}} className={`model-marker ${props.activeChapter===section.id?'selected':''}`} aria-current={props.activeChapter===section.id?'page':undefined} aria-label={`Open ${section.label} — ${section.region}`} onClick={event=>followLink(event,routeHref('/'+section.id,location.search),props.onNavigate)}><span className="marker-label"><span>{section.label}</span></span><span className="marker-dot" ref={el=>{dots.current[section.id]=el;}}/></a>)}
    </div>}

  </div>;
});
