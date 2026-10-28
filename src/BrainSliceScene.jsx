import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {registerAnatomyPoint} from './registration.mjs';
import {coronalContour,sliceGeometry,contourRing,sliceMaterial,majorVesselMaterial,flightEase,fitBrainDistance} from './brainSlice.mjs';

const fallbackView={position:[-1.8,1.8,5.3],target:[0,1,.15]};
export const BrainSliceScene=forwardRef(function BrainSliceScene({extracted,closing=false,initialView,onSelectSlice,onReady,onReturnStart,onReturned,textureUrl='/vascupath/original.jpg'},ref){
 const host=useRef(null),engine=useRef(null),live=useRef(null),returnStarted=useRef(false),returned=useRef(false);
 const [status,setStatus]=useState('loading'),[imageError,setImageError]=useState(false);
 live.current={extracted,closing,onSelectSlice,onReady,onReturnStart,onReturned};
 const signalReturnStart=()=>{if(!returnStarted.current){returnStarted.current=true;live.current.onReturnStart?.();}};
 const signalReturned=()=>{if(!returned.current){returned.current=true;live.current.onReturned?.();}};
 useImperativeHandle(ref,()=>({zoom:direction=>engine.current?.zoom(direction),reset:()=>engine.current?.reset()}),[]);
 useEffect(()=>{
  const container=host.current;setStatus('loading');setImageError(false);let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
  catch{setStatus('unsupported');live.current.onReady?.(false);return;}
  let cancelled=false,frame=0,dirty=true,last=0,loaded=false,phase='loading',phaseStart=null,amount=0,entryProgress=0,returnProgress=0,contextOpacity=1;
  let slab=null,pick=null,brain=null,arteries=null,vessels=null,slotMaterial=null,brainBounds=null,capBounds=null,previousTarget=false,autoFrame=true,zoomScale=1;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,original=initialView||fallbackView;
  const initialPosition=new THREE.Vector3().fromArray(original.position),initialTarget=new THREE.Vector3().fromArray(original.target);
  const homeDirection=initialPosition.clone().sub(initialTarget).normalize(),frameDirection=homeDirection.clone();
  const focusTarget=new THREE.Vector3(),extractTarget=new THREE.Vector3(),sliceOffset=new THREE.Vector3();let focusDistance=3.5,extractDistance=5;
  const geometries=new Set(),materials=new Set(),textures=new Set(),sliceTargets=[];
  const scene=new THREE.Scene();scene.background=new THREE.Color(0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Interactive brain with a highlighted illustrative coronal slice. Select the slice or press Enter to explore. Drag or use arrow keys to rotate; plus and minus zoom.');
  Object.assign(canvas.style,{display:'block',width:'100%',height:'100%',touchAction:'pan-y'});container.prepend(canvas);
  const camera=new THREE.PerspectiveCamera(34,1,.05,50);camera.position.copy(initialPosition);
  const controls=new OrbitControls(camera,canvas);controls.target.copy(initialTarget);controls.enablePan=false;controls.enableDamping=false;controls.dampingFactor=.09;controls.rotateSpeed=.5;controls.zoomSpeed=.65;controls.minDistance=1.8;controls.maxDistance=20;controls.enabled=false;
  controls.minPolarAngle=Math.PI*.18;controls.maxPolarAngle=Math.PI*.82;canvas.style.touchAction='pan-y';
  camera.lookAt(initialTarget);camera.updateMatrixWorld(true);
  controls.addEventListener('change',()=>{dirty=true;});controls.addEventListener('start',()=>{autoFrame=false;});
  scene.add(new THREE.HemisphereLight(0xfff3dc,0x302a27,1.5));
  for(const [color,intensity,x,y,z] of [[0xffeed7,3.1,4,6,7],[0xffffff,1.5,-5,2,3],[0xf5e5cf,2.2,2,4,-4]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);}
  const uniforms={sliceHover:{value:0},sliceExtract:{value:0},sliceHighlight:{value:0}};
  const root=new THREE.Group();scene.add(root);
  const draco=new DRACOLoader().setDecoderPath('/draco/'),loader=new GLTFLoader().setDRACOLoader(draco);
  const discardSource=model=>model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
  const loadModel=async name=>{
   const [{scene:model},weights]=await Promise.all([loader.loadAsync('/models/'+name+'.glb'),name==='arteries'?fetch('/models/density/arteries.bin').then(async response=>{if(!response.ok)throw new Error('Vessel structure weights unavailable');return new Uint16Array(await response.arrayBuffer());}):null]);
   if(cancelled){discardSource(model);return null;}
   let offset=0;model.traverse(mesh=>{if(!mesh.isMesh)return;
    const position=mesh.geometry.attributes.position;
    if(weights){if(offset+position.count>weights.length)throw new Error('Vessel structure/model mismatch');mesh.geometry.setAttribute('revealDensity',new THREE.Uint16BufferAttribute(weights.subarray(offset,offset+position.count),1,true));offset+=position.count;}
    for(let i=0;i<position.count;i++)position.setXYZ(i,...registerAnatomyPoint(position.getX(i),position.getY(i),position.getZ(i)));
    position.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();mesh.geometry.computeBoundingBox();geometries.add(mesh.geometry);
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();
   });if(weights&&offset!==weights.length)throw new Error('Unused vessel structure weights');return model;
  };
  const updateFit=()=>{
   if(!brainBounds||!capBounds)return;
   brainBounds.getCenter(focusTarget);
   const union=brainBounds.clone().union(capBounds.clone().translate(sliceOffset));union.getCenter(extractTarget);
   focusDistance=fitBrainDistance(brainBounds,focusTarget,frameDirection,camera.aspect,camera.fov);
   extractDistance=fitBrainDistance(union,extractTarget,frameDirection,camera.aspect,camera.fov);
  };
  const framePose=(progress,position=new THREE.Vector3(),center=new THREE.Vector3())=>{
   center.copy(focusTarget).lerp(extractTarget,progress);
   position.copy(center).addScaledVector(frameDirection,THREE.MathUtils.lerp(focusDistance,extractDistance,progress)*zoomScale);
   return {position,center};
  };
  const applyPose=(position,center)=>{camera.position.copy(position);controls.target.copy(center);camera.lookAt(center);camera.updateMatrixWorld(true);dirty=true;};
  const frameCamera=()=>{const pose=framePose(amount);applyPose(pose.position,pose.center);};
  const chooseOffset=()=>{
   const width=brainBounds.getSize(new THREE.Vector3()).x;
   sliceOffset.set(-frameDirection.z,0,frameDirection.x).normalize().multiplyScalar(width*1.18).addScaledVector(frameDirection,.05);
  };
  const tissuePromise=new THREE.TextureLoader().loadAsync(textureUrl).then(texture=>{if(cancelled){texture.dispose();return null;}texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.add(texture);return texture;}).catch(()=>{if(!cancelled)setImageError(true);return null;});
  Promise.all([loadModel('brain'),loadModel('arteries'),tissuePromise]).then(async([brainModel,arteriesModel,texture])=>{
   if(cancelled||!brainModel||!arteriesModel)return;brain=brainModel;arteries=arteriesModel;root.add(brain,arteries);root.updateMatrixWorld(true);
   brainBounds=new THREE.Box3().setFromObject(brain);const size=brainBounds.getSize(new THREE.Vector3()),z=THREE.MathUtils.lerp(brainBounds.min.z,brainBounds.max.z,.56),half=Math.max(.03,size.z*.03);
   const context=sliceMaterial({z,half,uniforms}),rim=sliceMaterial({z,half,role:'slab',uniforms});vessels=majorVesselMaterial(.4);
   for(const material of [context,rim,vessels])materials.add(material);
   brain.traverse(o=>{if(o.isMesh)o.material=context;});arteries.traverse(o=>{if(o.isMesh)o.material=vessels;});
   const contour=coronalContour(brain,z);slab=new THREE.Group();scene.add(slab);
   const surface=brain.clone(true);surface.traverse(o=>{if(o.isMesh)o.material=rim;});slab.add(surface);
   const face=new THREE.MeshBasicMaterial({map:texture,color:texture?'#ffffff':'#b38eac',toneMapped:false,side:THREE.DoubleSide}),edge=new THREE.MeshStandardMaterial({color:'#b37e78',roughness:.74}),red=new THREE.MeshBasicMaterial({color:'#ee322c',toneMapped:false});
   for(const material of [face,edge,red])materials.add(material);
   const capGeometry=sliceGeometry(contour,z,half*2,texture?texture.image.width/texture.image.height:1.5);geometries.add(capGeometry);capBounds=capGeometry.boundingBox.clone().expandByScalar(.015);
   const cap=new THREE.Mesh(capGeometry,[face,edge]);slab.add(cap);sliceTargets.push(cap);
   for(const side of [-1,1]){const geometry=contourRing(contour,z+half*side);geometries.add(geometry);const ring=new THREE.Mesh(geometry,red);slab.add(ring);sliceTargets.push(ring);}
   const slotGeometry=contourRing(contour,z,.006);slotMaterial=new THREE.MeshBasicMaterial({color:'#ee322c',toneMapped:false,transparent:true,opacity:0,depthWrite:false});geometries.add(slotGeometry);materials.add(slotMaterial);scene.add(new THREE.Mesh(slotGeometry,slotMaterial));
   pick=new THREE.Mesh(capGeometry,face);pick.updateMatrixWorld(true);chooseOffset();updateFit();
   slab.visible=true;
   if(renderer.extensions.has('KHR_parallel_shader_compile'))await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
   if(cancelled)return;slab.visible=false;loaded=true;phase='entering';phaseStart=null;
   // Preparation and resize retain the incoming Projects pose until entry starts.
   applyPose(initialPosition,initialTarget);renderer.render(scene,camera);dirty=false;
   if(import.meta.env.DEV)canvas.__brainSlice={scene,camera,controls,brain,arteries,slab,sliceTarget:pick,vesselThreshold:.4,initialPosition:initialPosition.toArray(),initialTarget:initialTarget.toArray(),sliceOffset,get amount(){return amount;},get progress(){return amount;},get extracted(){return Boolean(live.current.extracted);},get entryProgress(){return entryProgress;},get returnProgress(){return returnProgress;},get phase(){return phase;},get vesselOpacity(){return contextOpacity;},get plane(){return {z,half};}};
   setStatus('ready');live.current.onReady?.(true);
  }).catch(error=>{if(!cancelled){console.error('Brain slice loading failed',error);setStatus('error');live.current.onReady?.(false);}});
  const resize=()=>{
   const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
   renderer.setPixelRatio(Math.max(1,Math.min(devicePixelRatio||1,2,Math.sqrt(1400000/(width*height)))));renderer.setSize(width,height);
   camera.aspect=width/height;camera.updateProjectionMatrix();updateFit();
   if(phase==='focused'&&autoFrame)frameCamera();dirty=true;
  };
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const drain=()=>{const position=camera.position.clone(),center=controls.target.clone();controls.enableDamping=false;controls.update();applyPose(position,center);};
  const interactive=()=>loaded&&phase==='focused'&&!live.current.closing;
  const zoom=direction=>{if(!interactive())return;autoFrame=false;drain();const offset=camera.position.clone().sub(controls.target).multiplyScalar(direction>0?.9:1.1).clampLength(1.8,20);applyPose(controls.target.clone().add(offset),controls.target);controls.enableDamping=true;};
  const reset=()=>{if(!interactive())return;drain();autoFrame=true;zoomScale=1;frameDirection.copy(homeDirection);if(amount<.001)chooseOffset();updateFit();frameCamera();controls.update();controls.enableDamping=true;};
  engine.current={zoom,reset,isReady:()=>loaded};
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  const hit=event=>{if(!pick)return false;const b=canvas.getBoundingClientRect();pointer.set((event.clientX-b.left)/b.width*2-1,-(event.clientY-b.top)/b.height*2+1);raycaster.setFromCamera(pointer,camera);return Boolean(raycaster.intersectObject(pick,false).length||(slab?.visible&&raycaster.intersectObjects(sliceTargets,false).length));};
  const pointerDown=event=>{if(event.button===0)down={x:event.clientX,y:event.clientY,id:event.pointerId};};
  const pointerUp=event=>{if(down&&down.id===event.pointerId&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<6&&interactive()&&hit(event))live.current.onSelectSlice?.();down=null;};
  const pointerMove=event=>{if(event.buttons)return;const hovering=interactive()&&hit(event);if(uniforms.sliceHover.value!==Number(hovering)){uniforms.sliceHover.value=Number(hovering);dirty=true;}canvas.style.cursor=hovering?'pointer':'grab';};
  const keydown=event=>{
   if(!interactive())return;
   if(['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))event.preventDefault();
   if(event.key==='Enter'||event.key===' '){live.current.onSelectSlice?.();return;}
   if(event.key==='+'||event.key==='=')zoom(1);if(event.key==='-')zoom(-1);if(event.key==='Home')reset();
   if(event.key.startsWith('Arrow')){autoFrame=false;drain();const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);if(event.key==='ArrowLeft')spherical.theta-=.12;if(event.key==='ArrowRight')spherical.theta+=.12;if(event.key==='ArrowUp')spherical.phi-=.08;if(event.key==='ArrowDown')spherical.phi+=.08;spherical.phi=THREE.MathUtils.clamp(spherical.phi,controls.minPolarAngle,controls.maxPolarAngle);applyPose(controls.target.clone().add(new THREE.Vector3().setFromSpherical(spherical)),controls.target);controls.update();controls.enableDamping=true;}
  };
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('keydown',keydown);
  const returnPosition=new THREE.Vector3(),returnTarget=new THREE.Vector3();let returnOpacity=0;
  const beginReturn=time=>{phase='returning';phaseStart=time;returnPosition.copy(camera.position);returnTarget.copy(controls.target);returnOpacity=contextOpacity;controls.enabled=false;controls.enableDamping=false;signalReturnStart();};
  const beginClose=time=>{
   drain();controls.enabled=false;
   if(amount>.0001){frameDirection.copy(camera.position).sub(controls.target).normalize();updateFit();zoomScale=camera.position.distanceTo(controls.target)/THREE.MathUtils.lerp(focusDistance,extractDistance,amount);autoFrame=true;phase='retracting';phaseStart=time;}
   else beginReturn(time);
  };
  const render=time=>{
   if(cancelled)return;frame=requestAnimationFrame(render);const dt=last?Math.max(0,(time-last)/1000):0;last=time;
   if(loaded&&live.current.closing&&!['retracting','returning','returned'].includes(phase))beginClose(time);
   if(phase==='entering'){
    if(phaseStart===null)phaseStart=time;
    const linear=reduced?1:Math.min(1,(time-phaseStart)/900);entryProgress=flightEase(linear);
    const goal=framePose(0);applyPose(initialPosition.clone().lerp(goal.position,entryProgress),initialTarget.clone().lerp(goal.center,entryProgress));contextOpacity=1-entryProgress;uniforms.sliceHighlight.value=entryProgress;
    if(linear===1){phase='focused';phaseStart=null;controls.update();controls.enableDamping=true;controls.enabled=true;}
   }else if(phase==='focused'){
    controls.update();const goal=live.current.extracted?1:0;
    if(Boolean(live.current.extracted)!==previousTarget){previousTarget=Boolean(live.current.extracted);frameDirection.copy(camera.position).sub(controls.target).normalize();if(amount<.001)chooseOffset();updateFit();zoomScale=camera.position.distanceTo(controls.target)/THREE.MathUtils.lerp(focusDistance,extractDistance,amount);autoFrame=true;}
    const next=reduced?goal:goal+(amount-goal)*Math.exp(-dt/.16);
    if(Math.abs(next-amount)>1e-5){amount=Math.abs(next-goal)<.0001?goal:next;if(autoFrame)frameCamera();dirty=true;}
    contextOpacity=0;uniforms.sliceHighlight.value=1;
   }else if(phase==='retracting'){
    const next=reduced?0:amount*Math.exp(-dt/.11);amount=next<.001?0:next;frameCamera();dirty=true;
    if(amount===0)beginReturn(time);
   }else if(phase==='returning'){
    const linear=reduced?1:Math.min(1,(time-phaseStart)/750);returnProgress=flightEase(linear);
    applyPose(returnPosition.clone().lerp(initialPosition,returnProgress),returnTarget.clone().lerp(initialTarget,returnProgress));contextOpacity=THREE.MathUtils.lerp(returnOpacity,1,returnProgress);uniforms.sliceHighlight.value=1-returnProgress;
    if(linear===1){applyPose(initialPosition,initialTarget);phase='returned';returnProgress=1;contextOpacity=1;uniforms.sliceHighlight.value=0;}
   }
   uniforms.sliceExtract.value=amount;if(slotMaterial)slotMaterial.opacity=(.72-.4*amount)*uniforms.sliceHighlight.value;
   if(slab){slab.visible=amount>.001;slab.position.copy(sliceOffset).multiplyScalar(amount);}
   if(vessels){vessels.opacity=contextOpacity;arteries.visible=contextOpacity>.001;}
   if(dirty){renderer.render(scene,camera);dirty=false;}
   if(phase==='returned')signalReturned();
  };frame=requestAnimationFrame(render);
  return()=>{cancelled=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('keydown',keydown);controls.dispose();draco.dispose();engine.current=null;for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();renderer.dispose();canvas.remove();};
 },[textureUrl]);
 useEffect(()=>{if(closing&&!engine.current?.isReady()){signalReturnStart();signalReturned();}},[closing,status]);
 return <div ref={host} className="brain-slice-scene">
  {status==='loading'&&<div className="brain-slice-status" role="status">Preparing the brain slice…</div>}
  {status==='unsupported'&&<div className="brain-slice-status" role="status">The 3D view is unavailable on this device. The research images remain available.</div>}
  {status==='error'&&<div className="brain-slice-status" role="alert">The brain model could not load. Close and reopen the explorer to retry.</div>}
  {imageError&&status==='ready'&&<span className="brain-slice-image-note" role="status">The slice texture could not load.</span>}
 </div>;
});
