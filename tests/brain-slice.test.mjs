import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {coronalContour,sliceGeometry} from '../src/brainSlice.mjs';

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
