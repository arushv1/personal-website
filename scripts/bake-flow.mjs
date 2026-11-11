// Bake an illustrative "path length from the aortic root" value for every artery
// vertex, used only to animate a pulse of light along the vessels. It is a
// display weight derived from mesh geometry, not a haemodynamic simulation.
// No source vertex is moved. Run with `npm run prepare:flow` after the artery
// model changes; the vertex order must match public/models/arteries.glb.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {KHRDracoMeshCompression} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';

const io=new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const file=await fs.readFile('public/models/arteries.glb'),doc=await io.readBinary(file);
const primitives=doc.getRoot().listMeshes().flatMap(mesh=>mesh.listPrimitives());
if(primitives.length!==1)throw new Error('Expected one merged artery primitive');
const p=primitives[0].getAttribute('POSITION').getArray(),idx=primitives[0].getIndices().getArray(),count=p.length/3;
const thickness=new Uint16Array((await fs.readFile('public/models/density/arteries.bin')).buffer.slice(0));
if(thickness.length!==count)throw new Error('Run npm run prepare:density first: thickness weights do not match the artery model');

// Weld coincident vertices so each tube is one connected surface.
const keys=new Map(),node=new Uint32Array(count),points=[];
for(let i=0;i<count;i++){
 const key=Math.round(p[i*3]*2e4)+','+Math.round(p[i*3+1]*2e4)+','+Math.round(p[i*3+2]*2e4);
 let id=keys.get(key);if(id===undefined){id=points.length/3;keys.set(key,id);points.push(p[i*3],p[i*3+1],p[i*3+2]);}
 node[i]=id;
}
const n=points.length/3,adjacency=Array.from({length:n},()=>[]);
const distance=(a,b)=>Math.hypot(points[a*3]-points[b*3],points[a*3+1]-points[b*3+1],points[a*3+2]-points[b*3+2]);
const link=(a,b,scale=1)=>{if(a===b)return;const d=distance(a,b)*scale;adjacency[a].push(b,d);adjacency[b].push(a,d);};
for(let t=0;t<idx.length;t+=3){const a=node[idx[t]],b=node[idx[t+1]],c=node[idx[t+2]];link(a,b);link(b,c);link(c,a);}

// The source model is hundreds of separate tube segments that touch or overlap.
// Join points that sit within a small radius so a path can pass between them.
const joinRadius=.022,cell=value=>Math.floor(value/joinRadius),grid=new Map();
for(let i=0;i<n;i++){const key=cell(points[i*3])+','+cell(points[i*3+1])+','+cell(points[i*3+2]);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);}
for(let i=0;i<n;i++){
 const cx=cell(points[i*3]),cy=cell(points[i*3+1]),cz=cell(points[i*3+2]);
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++)for(const j of grid.get((cx+dx)+','+(cy+dy)+','+(cz+dz))||[])if(j>i&&distance(i,j)<=joinRadius)link(i,j,1.5);
}

// Seed at the lowest part of the ascending aorta: the widest vessel, front and
// centre of the upper chest (the heart itself lies below the cropped model).
const seeds=[];let lowest=Infinity;
for(let i=0;i<count;i++){
 const x=p[i*3],y=p[i*3+1],z=p[i*3+2];
 if(thickness[i]/65535>.95&&x>-.3&&x<.2&&z>.1&&z<.65&&y<-1.5){seeds.push(i);lowest=Math.min(lowest,y);}
}
const root=seeds.filter(i=>p[i*3+1]<lowest+.08).map(i=>node[i]);
if(root.length<8)throw new Error('Could not locate the ascending aorta; check the seed region for this model');

// Dijkstra with a binary heap.
const dist=new Float64Array(n).fill(Infinity),heap=[];
const push=(id,value)=>{let i=heap.length;heap.push([value,id]);while(i>0){const parent=(i-1)>>1;if(heap[parent][0]<=heap[i][0])break;[heap[parent],heap[i]]=[heap[i],heap[parent]];i=parent;}};
const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
const relax=()=>{while(heap.length){const [value,id]=pop();if(value>dist[id])continue;const edges=adjacency[id];for(let k=0;k<edges.length;k+=2){const next=value+edges[k+1];if(next<dist[edges[k]]){dist[edges[k]]=next;push(edges[k],next);}}}};
for(const id of new Set(root)){dist[id]=0;push(id,0);}
relax();
// Bridge any segment that is still unreached to its nearest reached neighbour,
// widening the search until every vertex has a value.
let bridged=0;
for(const radius of [.05,.1,.2,.4,.8,4]){
 const unreached=[];for(let i=0;i<n;i++)if(dist[i]===Infinity)unreached.push(i);
 if(!unreached.length)break;
 const reachedGrid=new Map(),c=value=>Math.floor(value/radius);
 for(let i=0;i<n;i++)if(dist[i]!==Infinity){const key=c(points[i*3])+','+c(points[i*3+1])+','+c(points[i*3+2]);if(!reachedGrid.has(key))reachedGrid.set(key,[]);reachedGrid.get(key).push(i);}
 for(const i of unreached){
  const cx=c(points[i*3]),cy=c(points[i*3+1]),cz=c(points[i*3+2]);let best=Infinity;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++)for(const j of reachedGrid.get((cx+dx)+','+(cy+dy)+','+(cz+dz))||[]){const d=distance(i,j);if(d<=radius)best=Math.min(best,dist[j]+d*1.5);}
  if(best<Infinity){push(i,best);bridged++;}
 }
 for(const item of heap)if(item[0]<dist[item[1]])dist[item[1]]=item[0];
 relax();
}
let unreached=0;for(let i=0;i<n;i++)if(dist[i]===Infinity)unreached++;
if(unreached)throw new Error(unreached+' artery vertices could not be reached');

// Normalise against a high percentile so a few far tips do not compress the rest.
const sorted=Float64Array.from(dist).sort(),q=x=>sorted[Math.floor((n-1)*x)],scale=q(.995);
const encoded=Uint8Array.from({length:count},(_,i)=>Math.round(Math.min(1,dist[node[i]]/scale)*255));
await fs.mkdir('public/models/flow',{recursive:true});
await fs.writeFile('public/models/flow/arteries.bin',encoded);
const manifest={
 description:'Illustrative path length from the ascending aorta along the artery mesh, normalised 0-255. Drives a display-only pulse; not a blood-flow measurement or simulation.',
 sourceSHA256:createHash('sha256').update(file).digest('hex'),vertexCount:count,weldedPoints:n,seedPoints:new Set(root).size,bridgedPoints:bridged,
 pathLengthQuantiles:[.25,.5,.75,.95,.995,1].map(x=>Number(q(x).toFixed(3))),
};
await fs.writeFile('public/models/flow/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest));
// Sanity: the skull vessels and the arm ends should be far from the root.
const mean=test=>{let sum=0,k=0;for(let i=0;i<count;i++)if(test(p[i*3],p[i*3+1],p[i*3+2])){sum+=encoded[i];k++;}return k?Math.round(sum/k):null;};
console.log('mean value near root',mean((x,y,z)=>Math.abs(x)<.25&&y<-1.6&&z>.1),'neck',mean((x,y)=>Math.abs(x)<.5&&y>-.6&&y<0),'head',mean((x,y)=>y>1),'arm ends',mean(x=>Math.abs(x)>1.6));
