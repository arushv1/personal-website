// Bake geometric thickness proxies without changing a single source vertex.
// These are synthetic display weights, not CT/HU measurements or a centerline.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {KHRDracoMeshCompression} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';

const io=new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const metadata={description:'Synthetic geometric thickness proxies for mesh display. Not patient density or HU.',models:{}};
await fs.mkdir('public/models/density',{recursive:true});
for(const name of ['bone','arteries']){
 const file=await fs.readFile(`public/models/${name}.glb`),doc=await io.readBinary(file);
 const primitives=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives());
 const outputs=[],counts=[],stats=[];
 for(const primitive of primitives){
  const p=primitive.getAttribute('POSITION').getArray(),n=primitive.getAttribute('NORMAL').getArray(),idx=primitive.getIndices().getArray(),count=p.length/3;
  const ids=Uint32Array.from({length:idx.length/3},(_,i)=>i),centers=new Float32Array(ids.length*3);
  for(let t=0;t<ids.length;t++)for(let a=0;a<3;a++)centers[t*3+a]=(p[idx[t*3]*3+a]+p[idx[t*3+1]*3+a]+p[idx[t*3+2]*3+a])/3;
  function build(start,end){
   const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
   for(let k=start;k<end;k++)for(let j=0;j<3;j++)for(let a=0;a<3;a++){const v=p[idx[ids[k]*3+j]*3+a];lo[a]=Math.min(lo[a],v);hi[a]=Math.max(hi[a],v);}
   const node={lo,hi,start,end};if(end-start<=12)return node;
   const spans=hi.map((v,a)=>v-lo[a]),axis=spans.indexOf(Math.max(...spans));
   ids.subarray(start,end).sort((a,b)=>centers[a*3+axis]-centers[b*3+axis]);
   const mid=(start+end)>>1;node.left=build(start,mid);node.right=build(mid,end);return node;
  }
  const root=build(0,ids.length);
  function thickness(v,sign){
   const ox=p[v*3],oy=p[v*3+1],oz=p[v*3+2],dx=n[v*3]*sign,dy=n[v*3+1]*sign,dz=n[v*3+2]*sign;
   let best=.8,found=false;
   function visit(node){
    let near=.00015,far=best;
    for(let a=0;a<3;a++){
     const o=a===0?ox:a===1?oy:oz,d=a===0?dx:a===1?dy:dz;
     if(Math.abs(d)<1e-10){if(o<node.lo[a]||o>node.hi[a])return;}
     else{let l=(node.lo[a]-o)/d,h=(node.hi[a]-o)/d;if(l>h)[l,h]=[h,l];near=Math.max(near,l);far=Math.min(far,h);if(near>far)return;}
    }
    if(node.left){visit(node.left);visit(node.right);return;}
    for(let k=node.start;k<node.end;k++){
     const t=ids[k]*3,a=idx[t]*3,b=idx[t+1]*3,c=idx[t+2]*3;
     const e1x=p[b]-p[a],e1y=p[b+1]-p[a+1],e1z=p[b+2]-p[a+2],e2x=p[c]-p[a],e2y=p[c+1]-p[a+1],e2z=p[c+2]-p[a+2];
     const hx=dy*e2z-dz*e2y,hy=dz*e2x-dx*e2z,hz=dx*e2y-dy*e2x,det=e1x*hx+e1y*hy+e1z*hz;if(Math.abs(det)<1e-10)continue;
     const sx=ox-p[a],sy=oy-p[a+1],sz=oz-p[a+2],u=(sx*hx+sy*hy+sz*hz)/det;if(u<0||u>1)continue;
     const qx=sy*e1z-sz*e1y,qy=sz*e1x-sx*e1z,qz=sx*e1y-sy*e1x,w=(dx*qx+dy*qy+dz*qz)/det;if(w<0||u+w>1)continue;
     const distance=(e2x*qx+e2y*qy+e2z*qz)/det;if(distance>.00015&&distance<best){best=distance;found=true;}
    }
   }
   visit(root);return found?best:0;
  }
  let missing=0;let raw=new Float32Array(count);
  for(let v=0;v<count;v++){raw[v]=thickness(v,-1);if(!raw[v]){missing++;raw[v]=thickness(v,1)||.006;}}
  // One-ring averaging suppresses individual triangle/ray errors. It never moves
  // geometry and cannot make the field depend on the camera or frame number.
  for(let pass=0;pass<3;pass++){
   const sum=new Float32Array(raw),weight=new Uint16Array(count).fill(1);
   for(let k=0;k<idx.length;k+=3){const a=idx[k],b=idx[k+1],c=idx[k+2];sum[a]+=raw[b]+raw[c];sum[b]+=raw[a]+raw[c];sum[c]+=raw[a]+raw[b];weight[a]+=2;weight[b]+=2;weight[c]+=2;}
   raw=Float32Array.from(sum,(v,i)=>v/weight[i]);
  }
  const sorted=Float32Array.from(raw).sort(),q=x=>Number(sorted[Math.floor((sorted.length-1)*x)].toFixed(5));
  const low=name==='arteries'?.006:.008,high=name==='arteries'?.16:.12;
  const encoded=Uint16Array.from(raw,v=>Math.round(Math.max(0,Math.min(1,Math.log(Math.max(low,v)/low)/Math.log(high/low)))*65535));
  outputs.push(Buffer.from(encoded.buffer));counts.push(count);stats.push({vertices:count,inwardRayMissFraction:missing/count,diameterQuantiles:[q(.05),q(.5),q(.9),q(.99)]});
 }
 await fs.writeFile(`public/models/density/${name}.bin`,Buffer.concat(outputs));
 metadata.models[name]={sourceSHA256:createHash('sha256').update(file).digest('hex'),vertexCounts:counts,stats};
 console.log(name,JSON.stringify(metadata.models[name]));
}
await fs.writeFile('public/models/density/manifest.json',JSON.stringify(metadata,null,2)+'\n');
