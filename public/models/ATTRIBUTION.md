# Model attribution and selected assets

## avatar.glb

Stylized avatar generated and textured by Arush Vyas using Meshy 6 Lite from an original likeness reference. Meshy output is licensed under CC BY 4.0.

Source: https://www.meshy.ai/

License: https://creativecommons.org/licenses/by/4.0/

The reference artwork was generated from Arush's supplied headshot and cartoon style reference using the built-in image-generation tool. The actual mesh and PBR textures were generated in Meshy and downloaded through its official GLB export. The account showed Free at export; no paid subscription was purchased.

Modifications: geometry reduction preserving UVs and normals, WebP texture resizing/compression, Draco compression, and position/scale registration to the illustrative internal atlas. The original textured export is retained in `source-assets/avatar/meshy-avatar-textured.glb`. Asset details are recorded in `avatar-manifest.json`.

The avatar is an artistic likeness. The skull, vessels, and brain are generic illustrative models, not a reconstruction of Arush's internal anatomy.

## bone.glb and arteries.glb

BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan

Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0

Source web export: https://github.com/nqwrc/3d-anatomy/tree/master/public/models

Source atlas: https://www.z-anatomy.com/

These derivatives contain only selected skeletal and arterial structures in the head, neck, and upper thorax. No kidney, inner-ear, white-matter, or other nervous-system meshes from that source collection are included in the served model assets. Modifications: structure selection, hierarchy flattening, cropping, geometry merging and reduction, Draco compression, and runtime display materials. Retain these notices and the upstream attribution when redistributing derivatives.

The original collection's notices are preserved in UPSTREAM-LICENSE.txt and NOTICE.txt. Those notices describe the complete source collection, including additional components that are not part of this prototype's selected exports.

## brain.glb

Brain for Blender, by Anderson Winkler, licensed CC BY-SA 3.0 Unported.

Primary source and license statement: https://brainder.org/research/brain-for-blender/

License: https://creativecommons.org/licenses/by-sa/3.0/

Direct downloaded source: https://s3.us-east-2.amazonaws.com/brainder/software/brain4blender/smallfiles/pial_Full_obj.tar.bz2

Modifications: left and right pial hemispheres merged, reorientation and registration to the generic atlas, smooth normals, geometry reduction, and Draco compression. Preserve attribution and applicable ShareAlike terms when redistributing this model or a derivative.

## Decoder

The bundled Draco decoder is from the Three.js distribution and is licensed under Apache-2.0. Three.js is MIT licensed.
