import * as THREE from 'three';

// The source model is a pial surface. This contour closes a display slab; it
// does not reconstruct an anatomical interior or register the research image.
export function coronalContour(root,z){
 const points=[],a=new THREE.Vector3(),b=new THREE.Vector3();
 root.updateMatrixWorld(true);
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const position=mesh.geometry.attributes.position,index=mesh.geometry.index;
  const count=index?index.count:position.count;
  for(let i=0;i<count;i+=3){
   const ids=[index?index.getX(i):i,index?index.getX(i+1):i+1,index?index.getX(i+2):i+2];
   for(let edge=0;edge<3;edge++){
    a.fromBufferAttribute(position,ids[edge]).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(position,ids[(edge+1)%3]).applyMatrix4(mesh.matrixWorld);
    if((a.z<z&&b.z<z)||(a.z>z&&b.z>z)||Math.abs(a.z-b.z)<1e-9)continue;
    const t=(z-a.z)/(b.z-a.z);
    if(t>=0&&t<=1)points.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
   }
  }
 });
 const unique=[...new Map(points.map(p=>[Math.round(p.x*1e5)+','+Math.round(p.y*1e5),p])).values()].sort((p,q)=>p.x-q.x||p.y-q.y);
 if(unique.length<3)throw new Error('The selected plane does not intersect the cortex');
 const cross=(o,p,q)=>(p.x-o.x)*(q.y-o.y)-(p.y-o.y)*(q.x-o.x);
 const lower=[],upper=[];
 for(const p of unique){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
 for(let i=unique.length-1;i>=0;i--){const p=unique[i];while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
 lower.pop();upper.pop();return lower.concat(upper);
}

export function sliceGeometry(contour,z,thickness,imageAspect=1){
 const shape=new THREE.Shape(contour.map(p=>new THREE.Vector2(p.x,p.y)));
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,steps:1});
 geometry.translate(0,0,z-thickness/2);geometry.computeBoundingBox();
 const bounds=geometry.boundingBox,size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const position=geometry.attributes.position,uv=geometry.attributes.uv;
 // Cover the face with a proportionally scaled crop instead of stretching the
 // supplied microscope image into the illustrative contour.
 const sx=imageAspect>size.x/size.y?size.y*imageAspect:size.x;
 const sy=imageAspect>size.x/size.y?size.y:size.x/imageAspect;
 for(let i=0;i<uv.count;i++)uv.setXY(i,.5+(position.getX(i)-center.x)/sx,.5+(position.getY(i)-center.y)/sy);
 uv.needsUpdate=true;return geometry;
}

export function contourRing(contour,z,radius=.004){
 const points=contour.map(p=>new THREE.Vector3(p.x,p.y,z));
 const curve=new THREE.CatmullRomCurve3(points,true,'centripetal');
 return new THREE.TubeGeometry(curve,Math.max(80,points.length*2),radius,5,true);
}

export function sliceMaterial({z,half,role='context',uniforms}){
 const material=new THREE.MeshStandardMaterial({color:'#bc796e',roughness:.72});
 material.onBeforeCompile=shader=>{
  shader.uniforms.sliceZ={value:z};shader.uniforms.sliceHalf={value:half};
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying float sliceLocalZ;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsliceLocalZ=position.z;');
  shader.fragmentShader='varying float sliceLocalZ;uniform float sliceZ;uniform float sliceHalf;uniform float sliceHover;uniform float sliceExtract;uniform float sliceHighlight;\n'+shader.fragmentShader;
  if(role==='slab')shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(abs(sliceLocalZ-sliceZ)>sliceHalf)discard;');
  else shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(sliceExtract>.001&&abs(sliceLocalZ-sliceZ)<sliceHalf*min(1.0,sliceExtract*3.0))discard;').replace('#include <opaque_fragment>',`float sliceBand=1.0-smoothstep(sliceHalf-.005,sliceHalf+.006,abs(sliceLocalZ-sliceZ));
   float sliceEdge=1.0-smoothstep(.003,.010,abs(abs(sliceLocalZ-sliceZ)-sliceHalf));
   outgoingLight=mix(outgoingLight,vec3(.95,.025,.015),sliceBand*.76*sliceHighlight);
   outgoingLight+=vec3(.72,.012,.008)*sliceEdge*(.8+.2*sliceHover)*sliceHighlight;
   #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=>`vascupath-coronal-${role}-v1`;
 return material;
}

// Use the existing baked structural proxy to retain the larger sourced
// vessels. This is a display threshold, never a clinical caliber measurement.
export function majorVesselMaterial(threshold=.4){
 const material=new THREE.MeshStandardMaterial({color:'#b60c08',roughness:.38,transparent:true,depthWrite:false});
 material.onBeforeCompile=shader=>{
  shader.uniforms.vesselThreshold={value:threshold};
  shader.vertexShader='attribute float revealDensity;varying float vesselStructure;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvesselStructure=revealDensity;');
  shader.fragmentShader='varying float vesselStructure;uniform float vesselThreshold;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vesselStructure<vesselThreshold)discard;');
 };
 material.customProgramCacheKey=()=>`vascupath-major-vessels-v1`;
 return material;
}

// Match the surrounding viewport's CSS cubic-bezier(.22,.65,.3,1) flight.
export function flightEase(value){
 const t=THREE.MathUtils.clamp(value,0,1);if(t===0||t===1)return t;
 let s=t;
 for(let i=0;i<7;i++){
  const k=1-s,x=3*k*k*s*.22+3*k*s*s*.3+s*s*s;
  const derivative=3*k*k*.22+6*k*s*(.3-.22)+3*s*s*(1-.3);
  if(derivative<1e-7)break;s=THREE.MathUtils.clamp(s-(x-t)/derivative,0,1);
 }
 const k=1-s;return 3*k*k*s*.65+3*k*s*s+s*s*s;
}

export function fitBrainDistance(bounds,target,direction,aspect,fov=34){
 const right=new THREE.Vector3(direction.z,0,-direction.x).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
 const tangent=Math.tan(THREE.MathUtils.degToRad(fov/2)),margin=.9;
 let distance=1.8;const point=new THREE.Vector3();
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  point.set(x,y,z).sub(target);const depth=point.dot(direction);
  distance=Math.max(distance,depth+Math.abs(point.dot(right))/(tangent*Math.max(.1,aspect)*margin),depth+Math.abs(point.dot(up))/(tangent*margin));
 }
 return distance;
}
