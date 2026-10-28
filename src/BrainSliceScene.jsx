import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {registerAnatomyPoint} from './registration.mjs';
import {coronalContour,sliceGeometry,contourRing,sliceMaterial,majorVesselMaterial} from './brainSlice.mjs';

export const BrainSliceScene=forwardRef(function BrainSliceScene({extracted,onSelectSlice,onReady,textureUrl='/vascupath/original.jpg'},ref){
 const host=useRef(null),engine=useRef(null),live=useRef({extracted,onSelectSlice,onReady});
 const [status,setStatus]=useState('loading'),[imageError,setImageError]=useState(false);
 live.current={extracted,onSelectSlice,onReady};
 useImperativeHandle(ref,()=>({zoom:direction=>engine.current?.zoom(direction),reset:()=>engine.current?.reset()}),[]);
 useEffect(()=>{
  const container=host.current;setStatus('loading');setImageError(false);let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
  catch{setStatus('unsupported');return;}
  let cancelled=false,frame=0,dirty=true,last=0,amount=live.current.extracted?1:0,previousTarget=Boolean(live.current.extracted),slab=null,pick=null,loaded=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const geometries=new Set(),materials=new Set(),textures=new Set();
  const scene=new THREE.Scene();scene.background=new THREE.Color(0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Interactive brain with a highlighted illustrative coronal slice. Select the slice or press Enter to explore. Drag or use arrow keys to rotate; plus and minus zoom.');
  Object.assign(canvas.style,{display:'block',width:'100%',height:'100%',touchAction:'pan-y'});container.prepend(canvas);
  const camera=new THREE.PerspectiveCamera(34,1,.05,50),target=new THREE.Vector3(0,.8,.05),extractedTarget=new THREE.Vector3(.72,.8,.18),homeDirection=new THREE.Vector3(3.4,.55,5.5).normalize();
  const controls=new OrbitControls(camera,canvas);controls.target.copy(target);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.rotateSpeed=.5;controls.zoomSpeed=.65;controls.minDistance=2.8;controls.maxDistance=12;
  controls.minPolarAngle=Math.PI*.18;controls.maxPolarAngle=Math.PI*.82;canvas.style.touchAction='pan-y';
  let homeDistance=4.6,extractedDistance=4.8,autoFrame=true,zoomScale=1;
  const frameDirection=homeDirection.clone(),frameTarget=new THREE.Vector3();
  const frameCamera=()=>{frameTarget.copy(target).lerp(extractedTarget,amount);controls.target.copy(frameTarget);camera.position.copy(frameTarget).addScaledVector(frameDirection,THREE.MathUtils.lerp(homeDistance,extractedDistance,amount)*zoomScale);controls.update();dirty=true;};
  camera.position.copy(target).addScaledVector(homeDirection,homeDistance);controls.update();
  controls.addEventListener('change',()=>{dirty=true;});
  controls.addEventListener('start',()=>{autoFrame=false;});
  scene.add(new THREE.HemisphereLight(0xfff3dc,0x302a27,1.5));
  for(const [color,intensity,x,y,z] of [[0xffeed7,3.1,4,6,7],[0xffffff,1.5,-5,2,3],[0xf5e5cf,2.2,2,4,-4]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);}
  const uniforms={sliceHover:{value:0},sliceExtract:{value:amount}},sliceTargets=[];let slotMaterial=null;
  const root=new THREE.Group();scene.add(root);
  const draco=new DRACOLoader().setDecoderPath('/draco/'),loader=new GLTFLoader().setDRACOLoader(draco);
  const discardSource=model=>model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
  const loadModel=async name=>{
   const [{scene:model},weights]=await Promise.all([
    loader.loadAsync('/models/'+name+'.glb'),
    name==='arteries'?fetch('/models/density/arteries.bin').then(async response=>{if(!response.ok)throw new Error('Vessel structure weights unavailable');return new Uint16Array(await response.arrayBuffer());}):null,
   ]);
   if(cancelled){discardSource(model);return null;}
   let offset=0;model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const position=mesh.geometry.attributes.position;
    if(weights){if(offset+position.count>weights.length)throw new Error('Vessel structure/model mismatch');mesh.geometry.setAttribute('revealDensity',new THREE.Uint16BufferAttribute(weights.subarray(offset,offset+position.count),1,true));offset+=position.count;}
    for(let i=0;i<position.count;i++)position.setXYZ(i,...registerAnatomyPoint(position.getX(i),position.getY(i),position.getZ(i)));
    position.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();mesh.geometry.computeBoundingBox();geometries.add(mesh.geometry);
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();
   });if(weights&&offset!==weights.length)throw new Error('Unused vessel structure weights');return model;
  };
  const tissuePromise=new THREE.TextureLoader().loadAsync(textureUrl).then(texture=>{
   if(cancelled){texture.dispose();return null;}
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.add(texture);return texture;
  }).catch(()=>{if(!cancelled)setImageError(true);return null;});
  Promise.all([loadModel('brain'),loadModel('arteries'),tissuePromise]).then(async([brain,arteries,texture])=>{
   if(cancelled||!brain||!arteries)return;
   root.add(brain,arteries);root.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(brain),size=bounds.getSize(new THREE.Vector3());
   const z=THREE.MathUtils.lerp(bounds.min.z,bounds.max.z,.56),half=Math.max(.03,size.z*.03);
   const context=sliceMaterial({z,half,uniforms}),rim=sliceMaterial({z,half,role:'slab',uniforms}),vessels=majorVesselMaterial(.4);
   for(const material of [context,rim,vessels])materials.add(material);
   brain.traverse(o=>{if(o.isMesh)o.material=context;});arteries.traverse(o=>{if(o.isMesh)o.material=vessels;});
   const contour=coronalContour(brain,z);
   slab=new THREE.Group();scene.add(slab);
   const surface=brain.clone(true);surface.traverse(o=>{if(o.isMesh)o.material=rim;});slab.add(surface);
   const face=new THREE.MeshBasicMaterial({map:texture,color:texture?'#ffffff':'#b38eac',toneMapped:false,side:THREE.DoubleSide}),edge=new THREE.MeshStandardMaterial({color:'#b37e78',roughness:.74}),red=new THREE.MeshBasicMaterial({color:'#ee322c',toneMapped:false});
   for(const material of [face,edge,red])materials.add(material);
   const capGeometry=sliceGeometry(contour,z,half*2,texture?texture.image.width/texture.image.height:1.5);geometries.add(capGeometry);
   const cap=new THREE.Mesh(capGeometry,[face,edge]);slab.add(cap);sliceTargets.push(cap);
   for(const side of [-1,1]){
    const ringGeometry=contourRing(contour,z+half*side);geometries.add(ringGeometry);const ring=new THREE.Mesh(ringGeometry,red);slab.add(ring);sliceTargets.push(ring);
   }
   const slotGeometry=contourRing(contour,z,.006);slotMaterial=new THREE.MeshBasicMaterial({color:'#ee322c',toneMapped:false,transparent:true,opacity:.72-.4*amount,depthWrite:false});geometries.add(slotGeometry);materials.add(slotMaterial);scene.add(new THREE.Mesh(slotGeometry,slotMaterial));
   // Raycast the real cross-section footprint, rather than a tiny point target.
   pick=new THREE.Mesh(capGeometry,face);pick.updateMatrixWorld(true);
   slab.visible=true;slab.position.set(1.45*amount,0,.25*amount);
   if(renderer.extensions.has('KHR_parallel_shader_compile'))await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
   if(cancelled)return;slab.visible=amount>.001;loaded=true;dirty=true;setStatus('ready');live.current.onReady?.();
   if(import.meta.env.DEV)canvas.__brainSlice={scene,camera,controls,brain,arteries,slab,sliceTarget:pick,vesselThreshold:.4,get amount(){return amount;},get progress(){return amount;},get extracted(){return Boolean(live.current.extracted);},get plane(){return {z,half};}};
  }).catch(error=>{if(!cancelled){console.error('Brain slice loading failed',error);setStatus('error');}});
  const resize=()=>{
   const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
   homeDistance=4.6;extractedDistance=Math.max(4.8,4.5/(width/height));
   if(autoFrame)frameCamera();
   renderer.setPixelRatio(Math.max(1,Math.min(devicePixelRatio||1,2,Math.sqrt(1400000/(width*height)))));renderer.setSize(width,height);
   camera.aspect=width/height;camera.updateProjectionMatrix();controls.update();dirty=true;
  };
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const drain=()=>{const position=camera.position.clone(),center=controls.target.clone();controls.enableDamping=false;controls.update();camera.position.copy(position);controls.target.copy(center);controls.update();controls.enableDamping=true;};
  const zoom=direction=>{autoFrame=false;drain();const offset=camera.position.clone().sub(controls.target).multiplyScalar(direction>0?.9:1.1).clampLength(2.8,12);camera.position.copy(controls.target).add(offset);controls.update();dirty=true;};
  const reset=()=>{drain();autoFrame=true;zoomScale=1;frameDirection.copy(homeDirection);frameCamera();};
  engine.current={zoom,reset};
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  const hit=event=>{if(!pick)return false;const b=canvas.getBoundingClientRect();pointer.set((event.clientX-b.left)/b.width*2-1,-(event.clientY-b.top)/b.height*2+1);raycaster.setFromCamera(pointer,camera);return Boolean(raycaster.intersectObject(pick,false).length||(slab?.visible&&raycaster.intersectObjects(sliceTargets,false).length));};
  // The extracted cap is the useful hit surface; the shader-clipped pial copy
  // retains its full CPU geometry and should not create invisible click targets.
  const pointerDown=event=>{if(event.button===0)down={x:event.clientX,y:event.clientY,id:event.pointerId};};
  const pointerUp=event=>{if(down&&down.id===event.pointerId&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<6&&loaded&&hit(event))live.current.onSelectSlice?.();down=null;};
  const pointerMove=event=>{if(event.buttons)return;const hovering=loaded&&hit(event);if(uniforms.sliceHover.value!==Number(hovering)){uniforms.sliceHover.value=Number(hovering);dirty=true;}canvas.style.cursor=hovering?'pointer':'grab';};
  const keydown=event=>{
   if(['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))event.preventDefault();
   if((event.key==='Enter'||event.key===' ')&&loaded){live.current.onSelectSlice?.();return;}
   if(event.key==='+'||event.key==='=')zoom(1);if(event.key==='-')zoom(-1);if(event.key==='Home')reset();
   if(event.key.startsWith('Arrow')){autoFrame=false;drain();const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);if(event.key==='ArrowLeft')spherical.theta-=.12;if(event.key==='ArrowRight')spherical.theta+=.12;if(event.key==='ArrowUp')spherical.phi-=.08;if(event.key==='ArrowDown')spherical.phi+=.08;spherical.phi=THREE.MathUtils.clamp(spherical.phi,controls.minPolarAngle,controls.maxPolarAngle);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();dirty=true;}
  };
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('keydown',keydown);
  const render=time=>{
   if(cancelled)return;frame=requestAnimationFrame(render);const dt=last?Math.max(0,(time-last)/1000):0;last=time;controls.update();
   const goal=live.current.extracted?1:0;if(Boolean(live.current.extracted)!==previousTarget){previousTarget=Boolean(live.current.extracted);frameDirection.copy(camera.position).sub(controls.target).normalize();zoomScale=camera.position.distanceTo(controls.target)/THREE.MathUtils.lerp(homeDistance,extractedDistance,amount);autoFrame=true;dirty=true;}
   const next=reduced?goal:goal+(amount-goal)*Math.exp(-dt/.16);
   if(Math.abs(next-amount)>1e-5){amount=Math.abs(next-goal)<.0001?goal:next;if(autoFrame)frameCamera();dirty=true;}
   uniforms.sliceExtract.value=amount;if(slotMaterial)slotMaterial.opacity=.72-.4*amount;if(slab){slab.visible=amount>.001;slab.position.set(1.45*amount,0,.25*amount);}
   if(dirty){renderer.render(scene,camera);dirty=false;}
  };frame=requestAnimationFrame(render);
  return()=>{
   cancelled=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('keydown',keydown);controls.dispose();draco.dispose();engine.current=null;
   for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();renderer.dispose();canvas.remove();
  };
 },[textureUrl]);
 return <div ref={host} className="brain-slice-scene">
  {status==='loading'&&<div className="brain-slice-status" role="status">Preparing the brain slice…</div>}
  {status==='unsupported'&&<div className="brain-slice-status" role="status">The 3D view is unavailable on this device. The research images remain available.</div>}
  {status==='error'&&<div className="brain-slice-status" role="alert">The brain model could not load. Close and reopen the explorer to retry.</div>}
  {imageError&&status==='ready'&&<span className="brain-slice-image-note" role="status">The slice texture could not load.</span>}
 </div>;
});
