import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { damp, revealState, layerBlend, revealMode } from './reveal.mjs';
import { followLink, routeHref } from './navigation.mjs';
import { LayerBlendRenderer } from './LayerBlendRenderer.mjs';
import { registerAnatomyPoint } from './registration.mjs';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export const AnatomyScene = forwardRef(function AnatomyScene(props, ref) {
  const host = useRef(null), engine = useRef(null), live = useRef(props), markers = useRef({});
  const [status, setStatus] = useState('loading'), [progress, setProgress] = useState(0);
  live.current = props;
  useImperativeHandle(ref, () => ({ reset: () => engine.current?.reset(), zoom: d => engine.current?.zoom(d), stopMotion: () => engine.current?.stopMotion() }), []);
  useEffect(() => {
    const container = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { setStatus('unsupported'); return; }
    let cancelled = false, frame = 0, last = 0, currentReveal = live.current.reveal, destination = null, wasExploring = live.current.exploring;
    const sectional = revealMode(location.search)==='section';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
    const canvas = renderer.domElement;
    canvas.setAttribute('role', 'img'); canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Interactive 3D avatar of Arush with illustrative internal anatomy. Drag to rotate; scroll or pinch to zoom. Arrow keys rotate, plus and minus zoom, Home resets.');
    container.prepend(canvas);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 50);
    const start = new THREE.Vector3(2.1, 1.3, 6.7); camera.position.copy(start);
    if(wasExploring)camera.position.set(4.7,1.3,3.4);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, wasExploring ? .7 : .55, 0); controls.enableDamping = true; controls.dampingFactor = 0.075;
    controls.enablePan = false; controls.minDistance = 2.5; controls.maxDistance = 10;
    controls.minPolarAngle = Math.PI * .18; controls.maxPolarAngle = Math.PI * .82;
    controls.rotateSpeed = .55; controls.zoomSpeed = .65; controls.autoRotateSpeed = .28; controls.update();
    controls.addEventListener('start', () => { destination = null; live.current.onInteraction(); });
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
    const anatomy = new THREE.Group(); scene.add(anatomy);
    const avatarMaterials = new Set();
    const cutUniform = {value: revealState(currentReveal).cut};
    const boneCut = {value: revealState(currentReveal).boneCut}, brainCut={value: revealState(currentReveal).brainCut};
    // Complementary section masks avoid blending two differently shaped faces.
    // Alpha hashing feathers only the narrow boundary and keeps depth-writing on.
    const section = (material, name) => {
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
    const blender=sectional?null:new LayerBlendRenderer(renderer,scene,camera,models);
    Promise.all(Object.keys(materials).map(async name => {
      const gltf = await loader.loadAsync(`/models/${name}.glb`);
      if(cancelled){ gltf.scene.traverse(o => o.geometry?.dispose()); return; }
      gltf.scene.traverse(o => { if(o.isMesh){
        // Register every internal layer using the same coordinates/landmarks.
        if(name !== 'avatar'){
          const positions=o.geometry.attributes.position;
          for(let i=0;i<positions.count;i++)positions.setXYZ(i,...registerAnatomyPoint(positions.getX(i),positions.getY(i),positions.getZ(i)));
          positions.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere();o.geometry.computeBoundingBox();
        }
        if(name === 'avatar'){
          for(const material of Array.isArray(o.material)?o.material:[o.material]){
            section(material,'avatar');material.side=THREE.FrontSide;avatarMaterials.add(material);
          }
        }else{o.material.dispose();o.material=materials[name];}
        o.renderOrder = 0;
      } });
      gltf.scene.userData.sectionBounds=new THREE.Box3().setFromObject(gltf.scene);
      models[name] = gltf.scene; anatomy.add(gltf.scene); setProgress(++completed / 4);needsRender=true;
    })).then(() => { if(!cancelled){ setStatus('ready'); live.current.onReady(); } }).catch(e => {
      if(!cancelled){ console.error('Anatomy loading failed', e); setStatus('error'); }
    });
    const anchors = { research:[.7,1.15,.05], roots:[.47,.92,-.59], making:[.49,1.35,.55], setup:[.67,.43,.05], stories:[.24,.62,-.8] };
    for(const [id,anchor] of Object.entries(anchors))anchors[id]=registerAnatomyPoint(...anchor);
    const projected = new THREE.Vector3();
    const drawnPosition=new THREE.Vector3(),drawnRotation=new THREE.Quaternion();
    let needsRender=true,drawnReveal=-1;
    const resize = () => { const {width,height} = container.getBoundingClientRect(); if(!width || !height)return; needsRender=true;renderer.setSize(width,height); camera.aspect=width/height; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const reset = () => { destination = { camera:start.clone(), target:new THREE.Vector3(0,.55,0) }; };
    const rotate = d => { destination=null; live.current.onInteraction(); const offset=camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0), d*.16); camera.position.copy(controls.target).add(offset); controls.update(); };
    const zoom = d => { destination=null; live.current.onInteraction(); const offset=camera.position.clone().sub(controls.target).multiplyScalar(d>0?.9:1.1).clampLength(2.5,10); camera.position.copy(controls.target).add(offset); controls.update(); };
    const keydown = e => {
      if(['ArrowLeft','ArrowRight','+','=','-','Home'].includes(e.key))e.preventDefault();
      if(e.key==='ArrowLeft')rotate(-1); if(e.key==='ArrowRight')rotate(1);
      if(e.key==='+'||e.key==='=')zoom(1); if(e.key==='-')zoom(-1); if(e.key==='Home')reset();
    };
    const stopMotion=()=>{
      destination=null;controls.autoRotate=false;
      // Drain OrbitControls inertia while preserving this exact viewing angle.
      const position=camera.position.clone(),target=controls.target.clone();
      controls.enableDamping=false;controls.update(0);
      camera.position.copy(position);controls.target.copy(target);controls.update(0);
      controls.enableDamping=true;
    };
    canvas.addEventListener('keydown',keydown); engine.current={reset,zoom,stopMotion};
    const render = time => {
      if(cancelled)return; frame=requestAnimationFrame(render); if(time-last<1000/60-1)return;
      const elapsed=Math.max(0,(time-last)/1000),dt=Math.min(elapsed,.1);last=time;const p=live.current;
      if(p.exploring!==wasExploring){ wasExploring=p.exploring; if(p.exploring)destination={target:new THREE.Vector3(0,.7,0),camera:new THREE.Vector3(4.7,1.3,3.4)};else reset(); }
      if(destination){ const blend=reduced?1:1-Math.exp(-elapsed/.22);camera.position.lerp(destination.camera,blend);controls.target.lerp(destination.target,blend);if(camera.position.distanceTo(destination.camera)<.012)destination=null; }
      controls.autoRotate=p.spinning&&!reduced&&!destination;controls.update(dt);
      currentReveal=reduced?p.reveal:damp(currentReveal,p.reveal,elapsed);
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
      const positions=[];
      for(const [id,anchor] of Object.entries(anchors)){
        const marker=markers.current[id];if(!marker)continue;
        projected.fromArray(anchor).project(camera);const w=container.clientWidth,h=container.clientHeight;
        let x=Math.max(38,Math.min(w-(marker.offsetWidth||100)-12,(projected.x*.5+.5)*w)),y=Math.max(25,Math.min(h-90,(-projected.y*.5+.5)*h));
        if(p.exploring)positions.forEach(prev=>{if(Math.abs(x-prev.x)<105&&Math.abs(y-prev.y)<48)y=prev.y+49;});
        positions.push({x,y});marker.style.transform=`translate(${x}px,${y}px)`;
      }
      // Avoid redrawing a half-million triangles while the scene is stationary.
      // Loading, resizing, orbiting and reveal movement all invalidate the frame.
      const viewChanged=needsRender || completed<4 || camera.position.distanceToSquared(drawnPosition)>1e-12 || 1-Math.abs(camera.quaternion.dot(drawnRotation))>1e-12;
      if(viewChanged || Math.abs(drawnReveal-currentReveal)>.0001){
        if(blender){if(viewChanged)blender.invalidate();blender.render(layerBlend(currentReveal));}
        else renderer.render(scene,camera);
        needsRender=false;drawnReveal=currentReveal;
        drawnPosition.copy(camera.position);drawnRotation.copy(camera.quaternion);
      }
    };frame=requestAnimationFrame(render);
    return () => { cancelled=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('keydown',keydown);controls.dispose();draco.dispose();anatomy.traverse(o=>o.geometry?.dispose());const textures=new Set();for(const m of avatarMaterials){for(const slot of ['map','normalMap','roughnessMap','metalnessMap'])if(m[slot])textures.add(m[slot]);m.dispose();}textures.forEach(t=>t.dispose());Object.values(materials).forEach(m=>m.dispose());blender?.dispose();renderer.dispose();canvas.remove();engine.current=null; };
  },[]);
  return <div className="anatomy-canvas" ref={host}>
    {status==='loading'&&<div className="model-loading" role="status"><span>Bringing the atlas into view</span><progress max="1" value={progress}/></div>}
    {status==='error'&&<div className="model-loading" role="alert"><p>The anatomy couldn’t load.</p><button onClick={()=>location.reload()}>Try again</button></div>}
    {status==='unsupported'&&<div className="model-loading" role="alert"><p>This browser could not start the 3D view.</p><a href={routeHref('/research',location.search)} onClick={event=>followLink(event,routeHref('/research',location.search),props.onNavigate)}>Explore the work</a></div>}
    {status==='ready'&&props.reveal>=32&&<div className="model-markers">{Object.entries({research:'Research',roots:'Roots',making:'Making',setup:'Setup',stories:'Stories'}).map(([id,name])=><a href={routeHref('/'+id,location.search)} key={id} ref={el=>{markers.current[id]=el;}} className={`model-marker ${props.activeChapter===id?'selected':''} ${!props.exploring&&id!=='research'?'is-hidden':''}`} aria-label={`Explore ${name}`} onClick={event=>followLink(event,routeHref('/'+id,location.search),props.onNavigate)}><span className="marker-dot"/><span className="marker-name">{name}</span></a>)}</div>}
  </div>;
});
