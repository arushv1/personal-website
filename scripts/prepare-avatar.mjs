import fs from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { weld, simplify, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

// Legitimate Meshy UI export, with its original UVs, PBR maps and materials.
// Keep the source intact; the frontend loads only the optimized derivative.
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read('source-assets/avatar/meshy-avatar-textured.glb');
await MeshoptSimplifier.ready;
await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: .25, error: .0015 }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', slots: /baseColorTexture/, resize: [2048, 2048], quality: 90 }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', slots: /normalTexture|metallicRoughnessTexture/, resize: [1024, 1024], quality: 85 }),
);
for (const node of doc.getRoot().listNodes()) {
  if (node.getMesh()) node.setName('Arush stylized avatar — Meshy 6 Lite').setScale([1.7, 1.7, 1.7]).setTranslation([0, .55, 0]);
}
doc.createExtension(KHRDracoMeshCompression).setRequired(true);
await io.write('public/models/avatar.glb', doc);
const triangles = doc.getRoot().listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().reduce((n, primitive) => n + primitive.getIndices().getCount() / 3, 0), 0);
await fs.writeFile('public/models/avatar-manifest.json', JSON.stringify({
  source: 'Meshy 6 Lite, generated and textured by Arush from the supplied avatar concept',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  creator: 'Arush Vyas / Meshy',
  sourceUrl: 'https://www.meshy.ai/',
  date: '2026-10-26',
  triangles,
  modifications: 'Geometry reduction preserving UVs/normals, WebP texture resizing/compression, scale/position registration and Draco compression.',
  original: 'source-assets/avatar/meshy-avatar-textured.glb',
  likenessReference: 'reference/arush-avatar-concept-v1.png',
  export: 'Downloaded through the official Meshy UI while the account showed Free; no paid subscription was purchased.',
}, null, 2));
console.log('Avatar:', triangles, 'triangles;', (await fs.stat('public/models/avatar.glb')).size, 'bytes');
