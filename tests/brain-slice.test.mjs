import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {coronalContour,sliceGeometry,flightEase,fitBrainDistance} from '../src/brainSlice.mjs';

test('coronal section uses the registered world position without modifying source vertices',()=>{
 const geometry=new THREE.BoxGeometry(2,4,2),original=geometry.attributes.position.array.slice();
 const mesh=new THREE.Mesh(geometry);mesh.position.set(3,5,2);
 const contour=coronalContour(mesh,2);
 assert.equal(contour.length,4);
 assert.deepEqual([Math.min(...contour.map(p=>p.x)),Math.max(...contour.map(p=>p.x))],[2,4]);
 assert.deepEqual([Math.min(...contour.map(p=>p.y)),Math.max(...contour.map(p=>p.y))],[3,7]);
 assert.deepEqual(geometry.attributes.position.array,original);
 assert.throws(()=>coronalContour(mesh,6),/does not intersect/);
 geometry.dispose();mesh.material.dispose();
});

test('illustrative cap has the requested thickness and preserves the image aspect ratio',()=>{
 const contour=[{x:-1,y:-2},{x:1,y:-2},{x:1,y:2},{x:-1,y:2}],snapshot=JSON.stringify(contour);
 const geometry=sliceGeometry(contour,.3,.08,2),box=geometry.boundingBox;
 assert(Math.abs(box.min.z-.26)<1e-6&&Math.abs(box.max.z-.34)<1e-6);
 const uv=geometry.attributes.uv,position=geometry.attributes.position;
 assert([...uv.array].every(Number.isFinite));
 const a=0;let b=-1,c=-1;
 for(let i=1;i<position.count;i++){
  if(Math.abs(position.getX(i)-position.getX(a))>.1&&Math.abs(position.getY(i)-position.getY(a))<1e-6)b=i;
  if(Math.abs(position.getY(i)-position.getY(a))>.1&&Math.abs(position.getX(i)-position.getX(a))<1e-6)c=i;
 }
 assert(b>=0&&c>=0);
 const worldPerU=Math.abs((position.getX(b)-position.getX(a))/(uv.getX(b)-uv.getX(a)));
 const worldPerV=Math.abs((position.getY(c)-position.getY(a))/(uv.getY(c)-uv.getY(a)));
 assert(Math.abs(worldPerU/worldPerV-2)<1e-5,'The image must be cropped proportionally, never stretched');
 assert.equal(JSON.stringify(contour),snapshot);
 geometry.dispose();
});


test('brain and extracted-slice framing keep every bound inside wide and narrow viewports',()=>{
 const bounds=new THREE.Box3(new THREE.Vector3(-2.5,.1,-.7),new THREE.Vector3(.9,1.8,.9));
 const target=bounds.getCenter(new THREE.Vector3()),direction=new THREE.Vector3(-1.8,.8,5.3).normalize();
 for(const aspect of [.55,1,1.7]){
  const camera=new THREE.PerspectiveCamera(34,aspect,.05,50);
  camera.position.copy(target).addScaledVector(direction,fitBrainDistance(bounds,target,direction,aspect));
  camera.lookAt(target);camera.updateMatrixWorld();
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   const projected=new THREE.Vector3(x,y,z).project(camera);
   assert(Math.abs(projected.x)<=.90001&&Math.abs(projected.y)<=.90001&&projected.z<1,'The fit should leave room for the full extracted group');
  }
 }
});

test('camera flights reach their exact endpoints and never reverse or overshoot',()=>{
 const values=Array.from({length:101},(_,i)=>flightEase(i/100));
 assert.equal(values[0],0);assert.equal(values.at(-1),1);
 assert(values.every((v,i)=>Number.isFinite(v)&&v>=0&&v<=1&&(!i||v>=values[i-1])));
});

// These use the real flight controller with preparation substituted, so timing
// and restoration can be checked independently of software-GPU frame rate.
async function flightFixture(){
 const {BrainSliceController}=await import('../src/BrainSliceController.mjs');
 const camera=new THREE.PerspectiveCamera(34,1,.05,50),target=new THREE.Vector3(0,1,.15);camera.position.set(-1.8,1.8,5.3);camera.lookAt(target);camera.updateMatrixWorld();
 const controls={target,enabled:true,enableDamping:true,autoRotate:false,minDistance:2.5,maxDistance:10,minPolarAngle:.2,maxPolarAngle:2.9,addEventListener(){},removeEventListener(){},update(){}};
 const density={uniforms:Object.fromEntries(['brainSliceZ','brainSliceHalf','brainSliceHighlight','brainSliceExtract'].map(key=>[key,{value:0}]))};
 const densityRenderer={focus:0,invalidate(){},unregisterSlice(){}};
 const controller=new BrainSliceController({renderer:{},scene:new THREE.Scene(),camera,controls,models:{},density,densityRenderer});
 controller.prepare=async()=>{controller._ready=true;controller.brainBounds=new THREE.Box3(new THREE.Vector3(-.8,.5,-.6),new THREE.Vector3(.8,2,.7));controller.capBounds=controller.brainBounds.clone();controller.slab=new THREE.Group();return true;};
 return {controller,camera,controls,densityRenderer};
}

test('one-camera flight fades context early, extracts left, and restores its exact source pose and controls',async()=>{
 const {controller,camera,controls,densityRenderer}=await flightFixture(),position=camera.position.toArray(),quaternion=camera.quaternion.toArray(),target=controls.target.toArray();
 let returned=0;await controller.enter();controller.update(0);controller.update(100);
 assert(densityRenderer.focus>0&&densityRenderer.focus<1,'Vessels should fade continuously');
 controller.update(280);assert.equal(densityRenderer.focus,1);assert(controller.entryProgress<1,'The tree should disappear before the zoom ends');
 controller.update(900);assert.equal(controller.phase,'focused');
 controller.extract(true);controller.update(1000);controller.update(1500);assert.equal(controller.progress,1);
 const a=controls.target.clone().project(camera),b=controls.target.clone().add(controller.slab.position).project(camera);assert(b.x<a.x);
 controller.close({onReturned:()=>returned++});controller.update(1600);controller.update(1920);controller.update(2000);controller.update(2470);
 assert.equal(densityRenderer.focus,1,'Keep the tree hidden until the final part of the return');
 controller.update(2750);assert.equal(returned,1);assert.equal(controller.phase,'returned');assert.equal(densityRenderer.focus,0);
 assert.deepEqual(camera.position.toArray(),position);assert.deepEqual(camera.quaternion.toArray(),quaternion);assert.deepEqual(controls.target.toArray(),target);
 assert.equal(controls.enabled,true);assert.equal(controls.minDistance,2.5);assert.equal(controls.maxDistance,10);controller.dispose();
});

test('closing while focus resources prepare cancels entry and restores controls without moving the camera',async()=>{
 const {controller,camera,controls}=await flightFixture(),position=camera.position.toArray();let resolve,returned=0;
 controller.prepare=()=>new Promise(ready=>{resolve=ready;});const entering=controller.enter();assert.equal(controls.enabled,false);
 controller.close({onReturned:()=>returned++});resolve(false);assert.equal(await entering,false);assert.equal(returned,1);assert.equal(controls.enabled,true);assert.deepEqual(camera.position.toArray(),position);controller.dispose();
});

test('unavailable comparison-mode focus restores its source pose even after controls have been restored',async()=>{
 const {controller,camera,controls}=await flightFixture(),position=camera.position.toArray(),target=controls.target.toArray(),quaternion=camera.quaternion.toArray();
 controller.prepare=async()=>false;assert.equal(await controller.enter(),false);camera.position.x+=1;controls.target.y+=.2;
 controller.close();assert.deepEqual(camera.position.toArray(),position);assert.deepEqual(controls.target.toArray(),target);assert.deepEqual(camera.quaternion.toArray(),quaternion);controller.dispose();
});
