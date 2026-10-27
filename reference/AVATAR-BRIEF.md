# Arush's actual 3D avatar: asset brief

Status: actual textured 3D mesh generated, exported, optimized, and integrated. The concept PNG is a generation reference and is not loaded as a flat portrait by the website. See `../design-qa.md` for current verification.

## Inputs and accepted direction

- Arush's supplied `headshot.png` is the likeness source. Do not include unrelated personal documents or its original filesystem location in public assets.
- `3d-avatar-style.png` is the user's style reference: a polished, rounded cartoon 3D character.
- `arush-avatar-concept-v1.png` is the generated front-view reference, 1122 × 1402 RGBA, used for the Meshy generation after Arush signed in and asked the agent to continue. Final likeness refinement remains open to his feedback.
- The photo cutout / 2.5D plane approach was explicitly rejected and removed from the active source before commit or deployment.

## Production record

Used Meshy Image to 3D with the generated character reference, followed by image-guided texturing with PBR maps. Each task used 10 free credits. Front, three-quarter, side, and back geometry were inspected in the workspace. Both GLBs were downloaded through the official UI while the account showed Free; no paid subscription was purchased. The UI identified the model license as CC BY 4.0. Published free-plan help was stricter than the export actually offered to this account; check current account eligibility for future work rather than assuming this result is universal.

Retained original: `../source-assets/avatar/meshy-avatar-textured.glb` (20,045,164 bytes). Web derivative: `../public/models/avatar.glb` (867,268 bytes; 124,180 triangles). `npm run prepare:avatar` preserves the original UVs, normals, and PBR maps while reducing geometry, resizing/compressing textures, registering the bust, and applying Draco compression. The runtime retains the loaded avatar materials instead of replacing them with generic colors.

- Image-to-3D: https://help.meshy.ai/en/articles/9996860-how-to-use-meshy-image-to-3d
- Export limitations: https://help.meshy.ai/en/articles/15696428-what-is-included-on-the-free-plan
- Current plans: https://www.meshy.ai/pricing

Tripo is an alternative with GLB export, but it also has plan-specific export limits. Neither generator had a matching plugin in the available directory when checked. Use an authorized browser session or a properly configured official API; never ask the user to paste credentials into chat.

## Required model delivery

- Textured GLB with actual geometry for the head, ears, neck, shoulders, curly hair, face, eyes, and blue collar.
- A recognizable stylized likeness: clean-shaven, smiling, curly black hair, dark brows and eyes, small stud earrings, warm skin tone grounded in the photograph. Do not borrow the sample character's beard, spiky hair, or identity.
- Front-facing neutral bust, upright Y, front toward positive Z after normalization. Hair, ears, chin, and shoulders must be complete from all views.
- Prefer separately addressable skin, hair, eyes, and shirt materials/meshes so the outer layer can reveal away cleanly. A single mesh can work with a common reveal material treatment.
- Inspect front, three-quarter, side, and back views in a real 3D viewer. Reject painted-on facial features that collapse from the side, holes in curls, or fused/incorrect ears.
- Reduce geometry/textures for the web after confirming the likeness. Retain the original exported model outside the served asset path for reversible optimization.

## Integration contract

Use the existing Three.js scene and GLTFLoader. The avatar and internal models must share the same world transform, orbit camera, zoom behavior, and lighting. Register skull center, chin, ears, neck base, and shoulders to the avatar. Adjust illustrative anatomy proportions carefully if the avatar has a larger cartoon head; do not claim those internals reconstruct Arush's actual anatomy.

The slider should travel through You → Bone → Vessels → Within. The first state is a genuine rotatable avatar mesh. Fade or clip its outer materials to uncover the aligned skull, then arteries and cortex. Reversing the slider must restore the same avatar at the same angle. Do not switch to a raster plane, crossfade between unrelated camera views, or impose portrait-only orbit limits.

Keep the current black/white/red layout, existing chapters, accessible slider and buttons, mobile scrolling, reduced-motion behavior, and generic-anatomy credits. If adding actual rigged head/eye motion later, keep the internal layers registered with those bones.

## Concept generation record

The concept was created with the built-in image-generation tool, using the headshot for likeness and the new avatar reference for style. It is a raster design input only. Exact prompt:

```text
Use case: stylized-concept
Asset type: ONE transparent front-view 3D character concept reference image for subsequent actual image-to-3D mesh generation. This must read as a coherent sculpted 3D bust.
Input images: Image 1 (original headshot) is the SOLE LIKENESS AND IDENTITY SOURCE for Arush. Image 2 (cartoon avatar) is STYLE ONLY: borrow the rounded animated-film character design, tactile matte materials, sculpted volumetric hair, and polished studio 3D-render quality; do not borrow that man's identity, beard, hair color or spiky hairstyle.
Subject: A recognizable youthful animated-film 3D character version of the young man in Image 1. Preserve warm medium-brown skin tone, youthful clean-shaven face, broad original toothy smile, strong dark eyebrows, dark eyes, face/jaw/nose proportions, both small silver stud earrings, and blue collared shirt. Give the dark eyes modest stylized enlargement like Image 2 while keeping his likeness. Thick curly BLACK hair follows Arush's original rounded abundant curly silhouette; express it as layered sculpted volumetric curls with broad readable 3D shapes, not thin photographic strands.
Composition/framing: Exactly straight-on FRONT VIEW, neutral upright centered head/neck/upper-chest bust. Symmetric shoulders, head faces straight forward without tilt, both ears visible. Full curly hair, ears, neck and shoulders uncut; include sufficient neck below jaw and upper chest. Leave transparent margins above hair and at sides. Portrait about 1024x1280. No hands, pose or props.
Style/medium: A true polished stylized 3D character render with tactile matte clay-like skin, subtle subsurface softness, rounded forms, broad modeled planes, sculpted curls and collar geometry. Depth must be legible for image-to-3D reconstruction. Not a flat illustration, photograph, photo cutout or photographic texture pasted on a face. Pleasant friendly expression. Studio lighting with soft clean highlights and gentle material shading; no dramatic shadows.
Scene/backdrop: Genuinely transparent alpha background, with no rectangular backdrop or shadow behind the bust.
Constraints: No beard, moustache, brown spiky hair, new accessories, extra person, photo-realism, text, typography, watermarks, logos, or background props. The character should strongly resemble the person in Image 1 while using only the stylized 3D character language of Image 2.
```
