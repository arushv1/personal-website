import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export const AnatomyScene = forwardRef(function AnatomyScene(props, ref) {
  const host = useRef(null), engine = useRef(null), live = useRef(props), markers = useRef({});
  const [status, setStatus] = useState('loading'), [progress, setProgress] = useState(0);
  live.current = props;
  useImperativeHandle(ref, () => ({ reset: () => engine.current?.reset(), zoom: d => engine.current?.zoom(d) }), []);
  useEffect(() => {
    const container = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { setStatus('unsupported'); return; }
    let cancelled = false, frame = 0, last = 0, currentReveal = live.current.reveal, destination = null, wasExploring = false;
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
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.55, 0); controls.enableDamping = true; controls.dampingFactor = 0.075;
    controls.enablePan = false; controls.minDistance = 2.5; controls.maxDistance = 10;
    controls.minPolarAngle = Math.PI * .18; controls.maxPolarAngle = Math.PI * .82;
    controls.rotateSpeed = .55; controls.zoomSpeed = .65; controls.autoRotateSpeed = .28; controls.update();
    controls.addEventListener('start', () => { destination = null; live.current.onInteraction(); });
    scene.add(new THREE.HemisphereLight(0xfff3dc, 0x302a27, 1.5));
    [[0xffeed7, 3.1, 4, 6, 7], [0xffffff, 1.5, -5, 2, 3], [0xf5e5cf, 2.2, 2, 4, -4]].forEach(([color,intensity,x,y,z]) => {
      const light = new THREE.DirectionalLight(color, intensity); light.position.set(x,y,z); scene.add(light);
    });
    const materials = {
      avatar: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, transparent: true, opacity: 1 }),
      bone: new THREE.MeshStandardMaterial({ color: '#b9a884', roughness: .77, transparent: true, opacity: 0 }),
      arteries: new THREE.MeshStandardMaterial({ color: '#bf0d09', roughness: .48, transparent: true, opacity: 0 }),
      brain: new THREE.MeshStandardMaterial({ color: '#bc796e', roughness: .88, transparent: true, opacity: 0 }),
    };
    const anatomy = new THREE.Group(); scene.add(anatomy);
    const avatarMaterials = new Set();
    const models = {}, draco = new DRACOLoader().setDecoderPath('/draco/');
    const loader = new GLTFLoader().setDRACOLoader(draco); let completed = 0;
    Promise.all(Object.keys(materials).map(async name => {
      const gltf = await loader.loadAsync(`/models/${name}.glb`);
      if(cancelled){ gltf.scene.traverse(o => o.geometry?.dispose()); return; }
      gltf.scene.traverse(o => { if(o.isMesh){
        // The cartoon bust has a shorter neck. Apply the same registration to
        // every internal layer, preserving the head and shared 3D coordinates.
        if(name !== 'avatar'){
          const positions=o.geometry.attributes.position;
          for(let i=0;i<positions.count;i++)if(positions.getY(i)<.15)positions.setY(i,.15+(positions.getY(i)-.15)*.55);
          positions.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere();
        }
        if(name === 'avatar'){
          for(const material of Array.isArray(o.material)?o.material:[o.material]){
            material.transparent=true;material.side=THREE.FrontSide;avatarMaterials.add(material);
          }
        }else{o.material.dispose();o.material=materials[name];}
        o.renderOrder = name === 'avatar' ? 3 : name === 'bone' ? 2 : name === 'arteries' ? 1 : 0;
      } });
      models[name] = gltf.scene; anatomy.add(gltf.scene); setProgress(++completed / 4);
    })).then(() => { if(!cancelled){ setStatus('ready'); live.current.onReady(); } }).catch(e => {
      if(!cancelled){ console.error('Anatomy loading failed', e); setStatus('error'); }
    });
    const anchors = { research:[.7,1.15,.05], roots:[.47,.92,-.59], making:[.49,1.35,.55], setup:[.67,.43,.05], stories:[.24,.62,-.8] };
    const projected = new THREE.Vector3();
    const resize = () => { const {width,height} = container.getBoundingClientRect(); if(!width || !height)return; renderer.setSize(width,height); camera.aspect=width/height; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const reset = () => { destination = { camera:start.clone(), target:new THREE.Vector3(0,.55,0) }; };
    const rotate = d => { destination=null; live.current.onInteraction(); const offset=camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0), d*.16); camera.position.copy(controls.target).add(offset); controls.update(); };
    const zoom = d => { destination=null; live.current.onInteraction(); const offset=camera.position.clone().sub(controls.target).multiplyScalar(d>0?.9:1.1).clampLength(2.5,10); camera.position.copy(controls.target).add(offset); controls.update(); };
    const keydown = e => {
      if(['ArrowLeft','ArrowRight','+','=','-','Home'].includes(e.key))e.preventDefault();
      if(e.key==='ArrowLeft')rotate(-1); if(e.key==='ArrowRight')rotate(1);
      if(e.key==='+'||e.key==='=')zoom(1); if(e.key==='-')zoom(-1); if(e.key==='Home')reset();
    };
    canvas.addEventListener('keydown',keydown); engine.current={reset,zoom};
    const render = time => {
      if(cancelled)return; frame=requestAnimationFrame(render); if(time-last<20)return;
      const dt=Math.min((time-last)/1000,.05);last=time;const p=live.current;
      if(p.exploring!==wasExploring){ wasExploring=p.exploring; if(p.exploring)destination={target:new THREE.Vector3(0,.7,0),camera:new THREE.Vector3(4.7,1.3,3.4)};else reset(); }
      if(destination){ camera.position.lerp(destination.camera,reduced?1:.055);controls.target.lerp(destination.target,reduced?1:.055);if(camera.position.distanceTo(destination.camera)<.012)destination=null; }
      controls.autoRotate=p.spinning&&!reduced&&!destination;controls.update(dt);
      currentReveal=THREE.MathUtils.lerp(currentReveal,p.reveal,reduced?1:.095);
      materials.avatar.opacity=1-THREE.MathUtils.smoothstep(currentReveal,5,32);
      materials.bone.opacity=THREE.MathUtils.smoothstep(currentReveal,4,26)*(1-THREE.MathUtils.smoothstep(currentReveal,43,80)*.97);
      materials.arteries.opacity=THREE.MathUtils.smoothstep(currentReveal,34,68);
      materials.brain.opacity=THREE.MathUtils.smoothstep(currentReveal,77,98);
      for(const [name,material] of Object.entries(materials)){
        material.depthWrite=material.opacity>.98;
        if(name==='avatar')for(const avatarMaterial of avatarMaterials){avatarMaterial.opacity=material.opacity;avatarMaterial.depthWrite=material.depthWrite;}
        if(models[name])models[name].visible=material.opacity>.005;
      }
      const positions=[];
      for(const [id,anchor] of Object.entries(anchors)){
        const marker=markers.current[id];if(!marker)continue;
        projected.fromArray(anchor).project(camera);const w=container.clientWidth,h=container.clientHeight;
        let x=Math.max(38,Math.min(w-(marker.offsetWidth||100)-12,(projected.x*.5+.5)*w)),y=Math.max(25,Math.min(h-90,(-projected.y*.5+.5)*h));
        if(p.exploring)positions.forEach(prev=>{if(Math.abs(x-prev.x)<105&&Math.abs(y-prev.y)<48)y=prev.y+49;});
        positions.push({x,y});marker.style.transform=`translate(${x}px,${y}px)`;
      }
      renderer.render(scene,camera);
    };frame=requestAnimationFrame(render);
    return () => { cancelled=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('keydown',keydown);controls.dispose();draco.dispose();anatomy.traverse(o=>o.geometry?.dispose());const textures=new Set();for(const m of avatarMaterials){for(const slot of ['map','normalMap','roughnessMap','metalnessMap'])if(m[slot])textures.add(m[slot]);m.dispose();}textures.forEach(t=>t.dispose());Object.values(materials).forEach(m=>m.dispose());renderer.dispose();canvas.remove();engine.current=null; };
  },[]);
  return <div className="anatomy-canvas" ref={host}>
    {status==='loading'&&<div className="model-loading" role="status"><span>Bringing the atlas into view</span><progress max="1" value={progress}/></div>}
    {status==='error'&&<div className="model-loading" role="alert"><p>The anatomy couldn’t load.</p><button onClick={()=>location.reload()}>Try again</button></div>}
    {status==='unsupported'&&<div className="model-loading" role="alert"><p>This browser could not start the 3D view.</p><button onClick={()=>props.onChapter('research')}>Explore the work</button></div>}
    {status==='ready'&&props.reveal>=32&&<div className="model-markers">{Object.entries({research:'Research',roots:'Roots',making:'Making',setup:'Setup',stories:'Stories'}).map(([id,name])=><button key={id} ref={el=>{markers.current[id]=el;}} className={`model-marker ${props.activeChapter===id?'selected':''} ${!props.exploring&&id!=='research'?'is-hidden':''}`} aria-label={`Explore ${name}`} onClick={()=>props.onChapter(id)}><span className="marker-dot"/><span className="marker-name">{name}</span></button>)}</div>}
  </div>;
});
