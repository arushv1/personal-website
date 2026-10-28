import * as THREE from 'three';
import {densityWindows,densityTransferGLSL} from './DensityReveal.mjs';

// Deferred surface-density rendering. Buffers hold lighting, depth, density and
// thickness, not finished scenes. Thresholds and depth sorting run per pixel.
const descriptions=[
 {name:'avatar',kind:0},
 {name:'bone',kind:1},{name:'bone',kind:1,peel:true},
 {name:'arteries',kind:2},{name:'arteries',kind:2,peel:true},{name:'arteries',kind:2,major:true},
 {name:'brain',kind:3},
];
// Supersample small/retina viewers without allowing the seven surface buffers
// to grow without bound. Never render below one pixel per CSS pixel.
export function densityPixelRatio(width,height,dpr,mobile=false){
 const pixelBudget=mobile?650000:1400000;
 return Math.max(1,Math.min(dpr||1,2,Math.sqrt(pixelBudget/Math.max(1,width*height))));
}
export class DensityRenderer{
 constructor(renderer,scene,camera,models,density){
  Object.assign(this,{renderer,scene,camera,models,density});this.size=new THREE.Vector2();this.revision=0;this.signature='';this.captures=0;this.needsRefinement=false;this.focus=0;this.lastValue=0;this.sliceSignature='';this.focusPreparationVersion=0;this.disposed=false;
  this.floating=renderer.extensions.has('EXT_color_buffer_float');density.uniforms.densityColorScale.value=this.floating?1:.25;
  this.slots=descriptions.map(spec=>this.createSlot(spec));
  this.materials=new Map();
  this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),null);this.output=new THREE.Scene();this.output.add(this.quad);this.outputCamera=new THREE.Camera();
  this.colorTarget=new THREE.WebGLRenderTarget(1,1,{type:this.floating?THREE.HalfFloatType:THREE.UnsignedByteType,depthBuffer:false});
  // A bounded nine-tap edge filter keeps small vessel edges smooth without
  // a long iterative FXAA search on low-power or software renderers.
  this.finalMaterial=new THREE.ShaderMaterial({
   uniforms:{image:{value:this.colorTarget.texture},resolution:{value:new THREE.Vector2()},decodeScale:{value:this.floating?1:4},edgeStrength:{value:.25}},depthTest:false,depthWrite:false,toneMapped:true,
   vertexShader:'varying vec2 pixel;void main(){pixel=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
   fragmentShader:`uniform sampler2D image;uniform vec2 resolution;uniform float decodeScale;uniform float edgeStrength;varying vec2 pixel;
    void main(){
     vec3 m=texture2D(image,pixel).rgb;vec3 nw=texture2D(image,pixel+vec2(-1.0,1.0)*resolution).rgb;vec3 ne=texture2D(image,pixel+resolution).rgb;vec3 sw=texture2D(image,pixel-resolution).rgb;vec3 se=texture2D(image,pixel+vec2(1.0,-1.0)*resolution).rgb;
     vec3 luma=vec3(.299,.587,.114);float lm=dot(m,luma),lnw=dot(nw,luma),lne=dot(ne,luma),lsw=dot(sw,luma),lse=dot(se,luma);
     float low=min(lm,min(min(lnw,lne),min(lsw,lse))),high=max(lm,max(max(lnw,lne),max(lsw,lse)));vec3 color=m;
     if(high-low>max(.025/decodeScale,high*.12)){
      vec2 direction=vec2(-((lnw+lne)-(lsw+lse)),((lnw+lsw)-(lne+lse)));
      float reduce=max((lnw+lne+lsw+lse)*.03125,.0078125);
      direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),vec2(-6.0),vec2(6.0))*resolution;
      vec3 a=.5*(texture2D(image,pixel+direction*(-1.0/6.0)).rgb+texture2D(image,pixel+direction*(1.0/6.0)).rgb);
      vec3 b=a*.5+.25*(texture2D(image,pixel-direction*.5).rgb+texture2D(image,pixel+direction*.5).rgb);float lb=dot(b,luma);color=mix(m,lb<low||lb>high?a:b,edgeStrength);
     }
     gl_FragColor=vec4(color*decodeScale,1.0);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`,
  });
  this.finalOutput=new THREE.Scene();this.finalOutput.add(new THREE.Mesh(this.quad.geometry,this.finalMaterial));
  for(let r=0;r<=100;r+=.125)this.compositeFor(r);
  this.quad.material=this.compositeFor(0);
 }
 createSlot(spec){
  const target=new THREE.WebGLRenderTarget(1,1,{count:2,type:THREE.UnsignedByteType,depthBuffer:true,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
  target.textures[0].type=this.floating?THREE.HalfFloatType:THREE.UnsignedByteType;
  target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
  return {...spec,target,revision:-1};
 }
 activeSlots(value,focus=0){
  const windows=densityWindows(value);
  return this.slots.flatMap((slot,i)=>focus>=1?(slot.name==='brain'||slot.name==='slice'?[i]:[]):((windows[slot.name]||focus>0&&(slot.name==='brain'||slot.name==='slice'))?[i]:[]));
 }
 compositeFor(value,focus=0){
  const indices=this.activeSlots(value,focus),key=(focus>0?'focus:':'')+indices.join('-');
  if(this.materials.has(key))return this.materials.get(key);
  const n=indices.length;
  const uniforms={reveal:{value:0},far:{value:this.camera.far},colorScale:{value:this.floating?1:4},encodeScale:{value:this.floating?1:.25},cameraWorld:{value:this.camera.matrixWorld},projectionScale:{value:new THREE.Vector2(this.camera.projectionMatrix.elements[0],this.camera.projectionMatrix.elements[5])}};
  if(focus>0){uniforms.focus={value:focus};uniforms.sliceVisible={value:0};}
  indices.forEach((global,i)=>{const slot=this.slots[global];uniforms['surface'+i]={value:slot.target.textures[0]};uniforms['features'+i]={value:slot.target.textures[1]};});
  const declarations=indices.map((_,i)=>`uniform sampler2D surface${i};uniform sampler2D features${i};`).join('\n');
  const samples=indices.map((global,i)=>{
   const slot=this.slots[global];return `
   depths[${i}]=1e8;colors[${i}]=vec4(0.0);
   {
    vec4 surface=texture2D(surface${i},pixel);vec4 f=texture2D(features${i},pixel);
    if(surface.a>.001){
     f/=surface.a;depths[${i}]=dot(f.xy,vec2(1.0,1.0/255.0))*far;
     vec3 rgb=surface.rgb/max(surface.a,.001)*colorScale;
     ${slot.kind===0?'float glass=ramp(15.0,23.0,reveal)*(1.0-ramp(28.0,34.0,reveal));rgb=rgb*(1.0-.06*glass)+vec3(.10,.13,.16)*f.a*glass;':''}
     vec3 p=(cameraWorld*vec4(vec3((pixel*2.0-1.0)/projectionScale,-1.0)*depths[${i}],1.0)).xyz;
     vec3 q=abs(fract(p*.63+vec3(.23,.47,.61))*2.0-1.0);q=q*q*(3.0-2.0*q)-.5;float curve=.08*(q.x*q.y+q.y*q.z+q.z*q.x);
     ${focus>0?`float alpha=${slot.kind===4?'sliceVisible':slot.kind===3?'mix(densityAlpha(3,clamp(f.b+curve,0.0,1.0),f.a,reveal),1.0,focus)':`densityAlpha(${slot.kind},clamp(f.b+curve,0.0,1.0),f.a,reveal)*(1.0-focus)`};colors[${i}]=vec4(rgb,clamp(alpha*surface.a,0.0,1.0));`:`colors[${i}]=vec4(rgb,clamp(densityAlpha(${slot.kind},clamp(f.b+curve,0.0,1.0),f.a,reveal)*surface.a,0.0,1.0));`}
    }
   }`;}).join('\n');
  const sorting=indices.map((_,i)=>indices.slice(i+1).map((_,j)=>{const k=i+j+1;return `if(depths[${k}]<depths[${i}]){float d=depths[${i}];depths[${i}]=depths[${k}];depths[${k}]=d;vec4 c=colors[${i}];colors[${i}]=colors[${k}];colors[${k}]=c;}`;}).join('\n')).join('\n');
  const compose=indices.map((_,i)=>`color+=transmission*colors[${i}].a*colors[${i}].rgb;transmission*=1.0-colors[${i}].a;`).join('\n');
  const [a,b,c]=[3,4,5].map(global=>indices.indexOf(global));
  const deduplicate=c>=0?`if(abs(depths[${a}]-depths[${c}])<.002||abs(depths[${b}]-depths[${c}])<.002)colors[${c}].a=0.0;`:'';
  const material=new THREE.ShaderMaterial({
   uniforms,depthTest:false,depthWrite:false,toneMapped:false,
   vertexShader:'varying vec2 pixel;void main(){pixel=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
   fragmentShader:`${declarations}
    uniform float reveal;uniform float far;uniform float colorScale;uniform float encodeScale;uniform mat4 cameraWorld;uniform vec2 projectionScale;varying vec2 pixel;
    ${focus>0?'uniform float focus;uniform float sliceVisible;':''}
    ${densityTransferGLSL}
    void main(){
     float depths[${n}];vec4 colors[${n}];${samples}
     ${deduplicate}
     ${sorting}
     vec3 color=vec3(0.0);float transmission=1.0;
     ${compose}
     gl_FragColor=vec4(color*encodeScale,1.0);
    }`,
  });
  this.materials.set(key,material);return material;
 }

 registerSlice(group){
  const existing=this.slots.find(slot=>slot.name==='slice');
  if(existing&&this.models.slice===group)return existing;
  this.unregisterSlice();
  if(!group.parent)this.scene.add(group);
  this.models.slice=group;const slot=this.createSlot({name:'slice',kind:4});this.slots.push(slot);this.sliceSignature='';this.focusPreparationVersion++;return slot;
 }
 unregisterSlice(){
  const index=this.slots.findIndex(slot=>slot.name==='slice');
  if(index<0)return;
  this.slots[index].target.dispose();this.slots.splice(index,1);this.models.slice?.removeFromParent();delete this.models.slice;
  for(const [key,material] of this.materials)if(key.startsWith('focus:')){if(this.quad.material===material)this.quad.material=this.compositeFor(this.lastValue);material.dispose();this.materials.delete(key);}
  this.sliceSignature='';this.focusPreparationVersion++;
 }
 invalidate(){this.revision++;}
 sync(){
  this.camera.updateMatrixWorld(true);this.renderer.getDrawingBufferSize(this.size);
  const signature=[...this.camera.matrixWorld.elements,...this.camera.projectionMatrix.elements,this.size.x,this.size.y].map(x=>x.toFixed(9)).join(',');
  if(signature!==this.signature){this.signature=signature;this.invalidate();}
  for(const slot of this.slots)if(slot.target.width!==this.size.x||slot.target.height!==this.size.y){slot.target.setSize(this.size.x,this.size.y);slot.revision=-1;}
  this.density.uniforms.densityResolution.value.copy(this.size);
  const u=this.density.uniforms;
  this.models.slice?.updateWorldMatrix(true,true);
  const sliceSignature=[u.brainSliceZ?.value??0,u.brainSliceHalf?.value??0,u.brainSliceHighlight?.value??0,u.brainSliceExtract?.value??0,...(this.models.slice?.matrixWorld.elements||[])].join(',');
  if(sliceSignature!==this.sliceSignature){this.sliceSignature=sliceSignature;for(const slot of this.slots)if(slot.name==='brain'||slot.name==='slice')slot.revision=-1;}
 }
 compositionSize(moving){
  // Keep the familiar lightweight pass during input. A still view gets every
  // pixel of the backing buffer, so there is no permanently enlarged image.
  const scale=moving?1/this.renderer.getPixelRatio():1;
  const width=Math.max(1,Math.round(this.size.x*scale)),height=Math.max(1,Math.round(this.size.y*scale));
  if(this.colorTarget.width!==width||this.colorTarget.height!==height)this.colorTarget.setSize(width,height);
  this.finalMaterial.uniforms.resolution.value.set(1/width,1/height);
  this.finalMaterial.uniforms.edgeStrength.value=moving?.7:.25;
 }
 capture(slot){
  if(slot.revision===this.revision||!this.models[slot.name])return;
  const {renderer,scene,camera,density}=this,background=scene.background,tone=renderer.toneMapping;
  const visibility=Object.values(this.models).map(m=>m.visible);
  try{
   for(const [name,model] of Object.entries(this.models))model.visible=name===slot.name;
   const previous=this.slots.find(s=>s.name===slot.name&&!s.peel&&!s.major);
   density.uniforms.densityPeel.value=slot.peel?1:0;
   density.uniforms.densityPreviousDepth.value=slot.peel?previous.target.depthTexture:null;
   density.uniforms.densityMajorOnly.value=slot.major?1:0;
   renderer.toneMapping=THREE.NoToneMapping;scene.background=null;renderer.setClearColor(0,0);renderer.setRenderTarget(slot.target);renderer.render(scene,camera);
   slot.revision=this.revision;this.captures++;
  }finally{scene.background=background;renderer.toneMapping=tone;renderer.setRenderTarget(null);Object.values(this.models).forEach((m,i)=>{m.visible=visibility[i];});}
 }
 prime(){this.sync();for(const slot of this.slots)if(this.focus<1||slot.name==='brain'||slot.name==='slice')this.capture(slot);}
 async prepare(){
  const {renderer,scene,camera}=this,tone=renderer.toneMapping;
  const visibility=Object.values(this.models).map(m=>m.visible);Object.values(this.models).forEach(m=>{m.visible=true;});
  const compile=renderer.extensions.has('KHR_parallel_shader_compile')?(...args)=>renderer.compileAsync(...args):(...args)=>Promise.resolve(renderer.compile(...args));
  let tasks;
  try{renderer.toneMapping=THREE.NoToneMapping;renderer.setRenderTarget(this.slots[0].target);tasks=[compile(scene,camera)];renderer.toneMapping=tone;renderer.setRenderTarget(null);for(const [name,model] of Object.entries(this.models))model.visible=name==='avatar';tasks.push(compile(scene,camera));for(const material of this.materials.values()){this.quad.material=material;tasks.push(compile(this.output,this.outputCamera));}tasks.push(compile(this.finalOutput,this.outputCamera));}
  finally{renderer.toneMapping=tone;renderer.setRenderTarget(null);Object.values(this.models).forEach((m,i)=>{m.visible=visibility[i];});}
  await Promise.all(tasks);this.prime();
 }
 async prepareFocus(value=this.lastValue){
  this.sync();const {renderer,scene,camera}=this,tone=renderer.toneMapping,target=renderer.getRenderTarget?.()||null,quadMaterial=this.quad.material,version=this.focusPreparationVersion;
  const roots=Object.values(this.models),visibility=roots.map(model=>model.visible),sliceNodes=[];
  const compile=renderer.extensions.has('KHR_parallel_shader_compile')?(...args)=>renderer.compileAsync(...args):(...args)=>Promise.resolve(renderer.compile(...args));
  const partial=this.compositeFor(value,.5),full=this.compositeFor(value,1),tasks=[];
  try{
   for(const [name,model] of Object.entries(this.models))model.visible=name==='slice';
   this.models.slice?.traverse(node=>{sliceNodes.push([node,node.visible]);node.visible=true;});
   renderer.toneMapping=THREE.NoToneMapping;renderer.setRenderTarget(this.slots.find(slot=>slot.name==='slice')?.target||this.slots[6].target);tasks.push(compile(scene,camera));
   renderer.toneMapping=tone;renderer.setRenderTarget(null);
   this.quad.material=partial;tasks.push(compile(this.output,this.outputCamera));this.quad.material=full;tasks.push(compile(this.output,this.outputCamera));
  }finally{for(const [node,visible] of sliceNodes)node.visible=visible;roots.forEach((model,i)=>{model.visible=visibility[i];});this.quad.material=quadMaterial;renderer.toneMapping=tone;renderer.setRenderTarget(target);}
  await Promise.all(tasks);
  if(this.disposed||version!==this.focusPreparationVersion)return false;
  // Warm allocations and both focus programs offscreen; the displayed atlas
  // remains untouched until the controller begins its camera/focus animation.
  this.sync();this.compositionSize(true);
  const captureUniforms=['densityPeel','densityPreviousDepth','densityMajorOnly','densityColorScale'].map(name=>[this.density.uniforms[name],this.density.uniforms[name].value]);
  const clearColor=renderer.getClearColor?.(new THREE.Color()).clone(),clearAlpha=renderer.getClearAlpha?.();
  try{
   for(const index of this.activeSlots(value,.5))if(this.slots[index].name!=='slice')this.capture(this.slots[index]);
   const slice=this.slots.find(slot=>slot.name==='slice');
   if(slice){const nodes=[];this.models.slice.traverse(node=>{nodes.push([node,node.visible]);node.visible=true;});try{slice.revision=-1;this.capture(slice);}finally{for(const [node,visible] of nodes)node.visible=visible;slice.revision=-1;}}
   for(const [material,focus] of [[partial,.5],[full,1]]){
    this.quad.material=material;material.uniforms.reveal.value=value;material.uniforms.focus.value=focus;material.uniforms.sliceVisible.value=this.models.slice?.visible?1:0;material.uniforms.projectionScale.value.set(camera.projectionMatrix.elements[0],camera.projectionMatrix.elements[5]);
    renderer.setRenderTarget(this.colorTarget);renderer.setClearColor(0,1);renderer.render(this.output,this.outputCamera);
   }
  }finally{for(const [uniform,previous] of captureUniforms)uniform.value=previous;if(clearColor)renderer.setClearColor(clearColor,clearAlpha);this.quad.material=quadMaterial;renderer.toneMapping=tone;renderer.setRenderTarget(target);}
  return true;
 }
 render(value,{moving=false}={}){
  this.lastValue=value;this.sync();const focus=THREE.MathUtils.clamp(this.focus||0,0,1);
  this.needsRefinement=moving&&(value>15||focus>0);
  // You is a natural opaque surface through 15. Use the original full-resolution
  // scene here; the density phase uses a bounded intermediate resolution.
  if(value<=15&&focus===0){
   const visibility=Object.values(this.models).map(m=>m.visible),u=this.density.uniforms,scale=u.densityColorScale.value;
   try{for(const [name,model] of Object.entries(this.models))model.visible=name==='avatar';u.densityPeel.value=0;u.densityPreviousDepth.value=null;u.densityMajorOnly.value=0;u.densityColorScale.value=1;this.renderer.setRenderTarget(null);this.renderer.setClearColor(0,1);this.renderer.render(this.scene,this.camera);}
   finally{u.densityColorScale.value=scale;Object.values(this.models).forEach((m,i)=>{m.visible=visibility[i];});}return;
  }
  this.compositionSize(moving);
  for(const index of this.activeSlots(value,focus))this.capture(this.slots[index]);
  this.quad.material=this.compositeFor(value,focus);this.quad.material.uniforms.reveal.value=value;if(focus>0){this.quad.material.uniforms.focus.value=focus;this.quad.material.uniforms.sliceVisible.value=this.models.slice?.visible?1:0;}this.quad.material.uniforms.projectionScale.value.set(this.camera.projectionMatrix.elements[0],this.camera.projectionMatrix.elements[5]);this.renderer.setRenderTarget(this.colorTarget);this.renderer.setClearColor(0,1);this.renderer.render(this.output,this.outputCamera);this.renderer.setRenderTarget(null);this.renderer.render(this.finalOutput,this.outputCamera);
 }
 dispose(){this.disposed=true;this.focusPreparationVersion++;for(const slot of this.slots)slot.target.dispose();this.colorTarget.dispose();this.finalMaterial.dispose();this.quad.geometry.dispose();for(const m of this.materials.values())m.dispose();}
}
