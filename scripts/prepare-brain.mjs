import fs from 'node:fs/promises';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { weld, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Brain for Blender: Anderson Winkler, CC BY-SA 3.0.
// Direct primary source: https://brainder.org/research/brain-for-blender/
const meshes=[];
for(const hemisphere of ['lh','rh']){
 const model=new OBJLoader().parse(await fs.readFile(`source-assets/brainder/${hemisphere}.pial.obj`,'utf8'));
 model.traverse(o=>{
  if(!o.isMesh)return;
  const geometry=o.geometry.clone();geometry.deleteAttribute('normal');geometry.deleteAttribute('uv');
  const indexed=mergeVertices(geometry,1e-5);indexed.computeVertexNormals();meshes.push(indexed);
 });
}
const geometry=mergeGeometries(meshes);
geometry.rotateX(-Math.PI/2);geometry.rotateY(Math.PI);
geometry.computeBoundingBox();
const original=geometry.boundingBox.clone(),center=original.getCenter(new THREE.Vector3()),size=original.getSize(new THREE.Vector3());
const target=new THREE.Box3(new THREE.Vector3(-.68888,.51789,-.98973),new THREE.Vector3(.68888,1.69635,.81567));
const targetSize=target.getSize(new THREE.Vector3()),targetCenter=target.getCenter(new THREE.Vector3());
geometry.translate(-center.x,-center.y,-center.z);
geometry.scale(targetSize.x/size.x,targetSize.y/size.y,targetSize.z/size.z);
geometry.translate(targetCenter.x,targetCenter.y,targetCenter.z);
const doc=new Document(),buffer=doc.createBuffer();
const material=doc.createMaterial('brain').setBaseColorFactor([.67,.31,.26,1]).setRoughnessFactor(.88);
const primitive=doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(geometry.attributes.position.array).setBuffer(buffer)).setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(geometry.attributes.normal.array).setBuffer(buffer)).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(geometry.index.array)).setBuffer(buffer)).setMaterial(material);
doc.createScene().addChild(doc.createNode('Brainder cortex — Anderson Winkler').setMesh(doc.createMesh('brain').addPrimitive(primitive)));
await MeshoptSimplifier.ready;
await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.20,error:.004}));
doc.createExtension(KHRDracoMeshCompression).setRequired(true);
const io=new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({'draco3d.encoder':await draco3d.createEncoderModule()});
await io.write('public/models/brain.glb',doc);
const manifest=JSON.parse(await fs.readFile('public/models/manifest.json','utf8'));
manifest.brain={source:'https://brainder.org/research/brain-for-blender/',creator:'Anderson Winkler',license:'CC BY-SA 3.0',triangles:doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((s,p)=>s+p.getIndices().getCount()/3,0),0),modifications:'Two hemispheres merged, reoriented and registered to the generic atlas, smooth normals, geometry reduction and Draco compression.'};
await fs.writeFile('public/models/manifest.json',JSON.stringify(manifest,null,2));
console.log('Direct-source cortex:',manifest.brain.triangles,'triangles;', (await fs.stat('public/models/brain.glb')).size,'bytes');
