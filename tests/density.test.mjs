import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {densityWindows,attachDensityField,sampleDensityField} from '../src/DensityReveal.mjs';
import {DensityRenderer,densityPixelRatio} from '../src/DensityRenderer.mjs';

test('baked thickness sidecars match the unchanged source models and have useful structural range',async()=>{
 const base=new URL('../public/models/',import.meta.url),manifest=JSON.parse(await fs.readFile(new URL('density/manifest.json',base),'utf8'));
 for(const name of ['bone','arteries']){
  const source=await fs.readFile(new URL(name+'.glb',base)),binary=await fs.readFile(new URL('density/'+name+'.bin',base)),spec=manifest.models[name];
  assert.equal(createHash('sha256').update(source).digest('hex'),spec.sourceSHA256,'Rebake density if model geometry changes');
  assert.equal(binary.byteLength,2*spec.vertexCounts.reduce((a,b)=>a+b,0));
  const weights=new Uint16Array(binary.buffer,binary.byteOffset,binary.byteLength/2);
  let small=0,large=0;for(const v of weights){small+=v<18000;large+=v>48000;}
  assert(small>100&&large>100,'The density proxy must distinguish thin and thick regions');
  assert(spec.stats.every(s=>s.inwardRayMissFraction<.06),'Too many unresolved geometric thickness estimates');
 }
});
test('shared density is deterministic, spatially continuous and never changes source positions',()=>{
 const a=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3));
 const b=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([1,2,3],3));
 const before=Array.from(a.attributes.position.array);
 attachDensityField(a,new THREE.Matrix4().makeTranslation(1,2,3));attachDensityField(b,new THREE.Matrix4());
 assert.deepEqual(Array.from(a.attributes.position.array),before);
 assert.equal(a.attributes.revealField.getX(0),b.attributes.revealField.getX(0),'Coincident anatomy must share the field regardless of mesh origin');
 for(let i=-10;i<10;i++){
  const p=[i*.17,i*.24,i*.33],v=sampleDensityField(...p);
  assert(v>=0&&v<=1);assert.equal(v,sampleDensityField(...p));
  assert(Math.abs(v-sampleDensityField(p[0]+.0001,p[1],p[2]))<.002);
 }
 a.dispose();b.dispose();
});
test('slider changes reuse surface buffers; orbit and resize invalidate them; resources are released',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.05,50),models=Object.fromEntries(['avatar','bone','arteries','brain'].map(name=>[name,new THREE.Group()]));
 let width=200,height=200,geometryDraws=0,target=null;
 const renderer={extensions:{has:()=>true},toneMapping:THREE.ACESFilmicToneMapping,getPixelRatio:()=>2,getDrawingBufferSize:v=>v.set(width,height),setRenderTarget:t=>{target=t;},setClearColor(){},render:s=>{if(s===scene)geometryDraws++;}};
 const density={uniforms:{densityColorScale:{},densityResolution:{value:new THREE.Vector2()},densityPeel:{},densityPreviousDepth:{},densityMajorOnly:{}}};
 const deferred=new DensityRenderer(renderer,scene,camera,models,density);deferred.prime();
 assert.equal(geometryDraws,7);geometryDraws=0;
 for(const r of [20,34,56,68,85,100,85,68,56,34,20])deferred.render(r);
 assert.equal(geometryDraws,0,'Density scrubbing must not rerender the meshes');
 deferred.render(56,{moving:true});assert.equal(deferred.colorTarget.width,100);assert.equal(deferred.needsRefinement,true);
 deferred.render(56);assert.equal(deferred.colorTarget.width,200);assert.equal(deferred.needsRefinement,false);
 assert.equal(geometryDraws,0,'Resolution refinement must reuse the same anatomical surfaces');
 camera.position.x=.3;deferred.render(85);assert.equal(geometryDraws,4);
 geometryDraws=0;width=300;height=400;deferred.render(34);assert.equal(geometryDraws,5);
 assert.equal(target,null);assert(Object.values(models).every(m=>m.visible));
 let disposed=0;for(const slot of deferred.slots)slot.target.addEventListener('dispose',()=>disposed++);
 deferred.colorTarget.addEventListener('dispose',()=>disposed++);deferred.dispose();assert.equal(disposed,8);
});
test('retina resolution respects supersampling budgets while keeping native CSS detail',()=>{
 assert.equal(densityPixelRatio(510,570,2),2);
 assert.equal(densityPixelRatio(510,570,1),1);
 assert.equal(densityPixelRatio(300,400,3,true),2);
 const mobile=densityPixelRatio(390,600,3,true);assert(mobile>1.5&&mobile<2);
 assert(mobile*mobile*390*600<=650001);
 assert.equal(densityPixelRatio(2000,1500,2),1);
});
test('overlapping density windows preserve the avatar, CTA and cortex landmarks',()=>{
 for(let value=0;value<=100;value+=.125){
  const state=densityWindows(value);
  assert(['avatar','bone','arteries','brain'].some(name=>state[name]),'No empty anatomical state');
 }
 for(const r of [0,5,15])assert.deepEqual(Object.fromEntries(['avatar','bone','arteries','brain'].map(k=>[k,densityWindows(r)[k]])),{avatar:true,bone:false,arteries:false,brain:false});
 assert(densityWindows(20).avatar&&densityWindows(20).bone);
 assert(densityWindows(34).bone&&!densityWindows(34).avatar);
 for(const r of [52,56,60,68])assert(densityWindows(r).bone&&densityWindows(r).arteries);
 assert(!densityWindows(85).bone&&densityWindows(85).arteries&&densityWindows(85).brain);
 assert(densityWindows(100).brain&&densityWindows(100).arteries);
});
