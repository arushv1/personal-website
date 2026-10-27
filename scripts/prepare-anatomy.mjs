import fs from 'node:fs/promises';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

// Retain only the anatomy used in this prototype. Flatten the source hierarchy
// before selection so child structures keep their original world registration.
const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
await MeshoptSimplifier.ready;
const floor = 1.33;
const metadata = {};
const specs = [
  { source: 'skeletal', name: 'bone', color: [0.78, 0.70, 0.52, 1], keep: n => !/cartilage|sinus|cells|incus|malleus|stapes|scapula/i.test(n) },
  { source: 'cardiovascular', name: 'arteries', color: [0.72, 0.025, 0.018, 1], keep: n => /arter|aorta|arch|brachiocephalic trunk/i.test(n) && !/vein|venous|sinus|ligament/i.test(n) },
];

for (const spec of specs) {
  const source = await io.read(`source-assets/${spec.source}.glb`);
  const geometries = [];
  const retained = [];
  for (const node of source.getRoot().listNodes()) {
    const mesh = node.getMesh();
    const name = node.getExtras().za_name || node.getName();
    if (!mesh || !spec.keep(name)) continue;
    const matrix = new THREE.Matrix4().fromArray(node.getWorldMatrix());
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    for (const primitive of mesh.listPrimitives()) {
      const position = primitive.getAttribute('POSITION');
      if (!position) continue;
      const pa = position.getArray();
      const na = primitive.getAttribute('NORMAL')?.getArray();
      const indices = primitive.getIndices()?.getArray() || Array.from({ length: pa.length / 3 }, (_, i) => i);
      const transformed = new Float32Array(pa.length);
      const normals = new Float32Array(pa.length);
      let maxY = -Infinity, minY = Infinity;
      const v = new THREE.Vector3();
      for (let i = 0; i < pa.length; i += 3) {
        v.fromArray(pa, i).applyMatrix4(matrix).toArray(transformed, i);
        maxY = Math.max(maxY, v.y); minY = Math.min(minY, v.y);
        if (na) v.fromArray(na, i).applyNormalMatrix(normalMatrix).toArray(normals, i);
      }
      if (maxY < floor || (spec.name === 'bone' && minY < 1.1)) continue;
      const map = new Map(), outputP = [], outputN = [], outputI = [];
      for (let i = 0; i < indices.length; i += 3) {
        const triangle = [indices[i], indices[i + 1], indices[i + 2]];
        if (triangle.some(k => transformed[k * 3 + 1] < floor)) continue;
        for (const k of triangle) {
          if (!map.has(k)) {
            map.set(k, outputP.length / 3);
            outputP.push(transformed[k * 3] * 10, (transformed[k * 3 + 1] - 1.53) * 10, transformed[k * 3 + 2] * 10);
            outputN.push(normals[k * 3], normals[k * 3 + 1], normals[k * 3 + 2]);
          }
          outputI.push(map.get(k));
        }
      }
      if (!outputI.length) continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(outputP, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(outputN, 3));
      geometry.setIndex(outputI);
      if (!na) geometry.computeVertexNormals();
      geometries.push(geometry); retained.push(name);
    }
  }
  const geometry = mergeGeometries(geometries);
  geometry.computeBoundingBox();
  const doc = new Document();
  const buffer = doc.createBuffer();
  const material = doc.createMaterial(spec.name).setBaseColorFactor(spec.color).setRoughnessFactor(0.75).setMetallicFactor(0);
  const primitive = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(geometry.attributes.position.array).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(geometry.attributes.normal.array).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(geometry.index.array)).setBuffer(buffer))
    .setMaterial(material);
  const outMesh = doc.createMesh(spec.name).addPrimitive(primitive);
  doc.createScene().addChild(doc.createNode(spec.name).setMesh(outMesh));
  await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: spec.name === 'arteries' ? 0.17 : 0.55, error: 0.002 }));
  doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER });
  await io.write(`public/models/${spec.name}.glb`, doc);
  metadata[spec.name] = { structures: retained.length, sourceTriangles: geometry.index.count / 3, triangles: doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((s,p)=>s+p.getIndices().getCount()/3,0),0), bounds: { min: geometry.boundingBox.min.toArray(), max: geometry.boundingBox.max.toArray() }, retained };
  console.log(spec.name, metadata[spec.name].structures, 'structures;', metadata[spec.name].triangles, 'triangles;', metadata[spec.name].bounds);
}
await fs.writeFile('public/models/manifest.json', JSON.stringify(metadata, null, 2));
await fs.copyFile('source-assets/License.txt', 'public/models/UPSTREAM-LICENSE.txt');
await fs.copyFile('source-assets/NOTICE', 'public/models/NOTICE.txt');
