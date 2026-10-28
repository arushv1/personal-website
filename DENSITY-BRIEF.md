I want to redesign the “Look within” transition on my personal website:

Repository: arushv1/personal-website

Before making changes, inspect the existing implementation and repository instructions. The site uses React, Three.js, and four separate polygonal models: avatar, bone, arteries, and brain. The current production transition is a sectional/top-to-bottom reveal, with an alternative whole-model crossfade. I want to replace the production effect with a much more fluid, medically inspired reveal.

VISUAL GOAL

I want the slider to evoke 3D Slicer’s CT volume-rendering Shift control. It should feel like a global density threshold passing through the anatomy—not a plane slicing down the model and not four finished scenes crossfading.

The camera, geometry, model registration, lighting, and pose should remain stationary while the slider moves. Only the apparent density and visibility of the tissues should change.

The structures should transition organically through:

solid → glassy → porous/smoky → fragmented → invisible

The effect must happen across the entire model simultaneously. There should be no obvious horizontal boundary. Reversing the slider should rebuild the layers through the exact same continuous process.

Because the website uses polygonal meshes rather than CT voxels with HU values, this will be a medically inspired mesh-based approximation. Use a shared shader-driven synthetic density field, soft thresholds, and overlapping visibility ranges. Do not imply that the model contains real patient density values.

NARRATIVE SEQUENCE

Preserve the current slider landmarks and labels:

- 0: You
- 34: Bone
- 68: Vessels
- 100: Within

Treat them as landmarks along one continuous transition, not four discrete rendering modes.

Recommended progression:

1. 0–15 — You
   - The textured avatar is fully opaque and natural.
   - Internal anatomy is hidden.

2. 15–35 — Surface reveal
   - The avatar becomes subtly glassy.
   - Its surface then dissolves organically throughout the whole model.
   - Bone and faint vessels become visible beneath it.
   - Preserve the silhouette briefly with realistic rim lighting.

3. 35–55 — Bone
   - The avatar is gone.
   - Bone is the dominant structure.
   - Vessels increasingly appear within and around it.

4. 55–70 — CTA transition
   - Bone and bright-red vessels coexist.
   - This should create the classic CTA appearance.
   - This is an important visual state and should look polished.

5. 70–85 — Vessels
   - Bone becomes porous and gradually recedes.
   - Vessels become dominant.
   - Small or thin vascular branches should disappear before thick central vessels.

6. 85–100 — Within
   - The cortex gradually emerges.
   - Thin vascular structures continue to erode.
   - The endpoint should show the cortex integrated with the major vascular tree.

IMPLEMENTATION CHARACTERISTICS

- Keep all meshes in one registered 3D scene.
- Use one continuously moving global reveal value.
- Use overlapping material windows so there is always a coherent anatomical composition.
- Favor shader-driven thresholds or baked per-vertex density attributes over ordinary mesh opacity switches.
- Use structural information where practical:
  - smaller vessels should vanish before large vessels;
  - thin or interior bone should recede before dense-looking outer portions;
  - major vessels should survive into the final “Within” view.
- Use broad, coherent, organic variation. Do not use noisy television-static speckling.
- The dissolution should look connected and mesh-aware, with gradual holes and thinning rather than random flickering pixels.
- Avoid visible popping, ghosted duplicate surfaces, harsh clipping planes, transparency-sorting errors, unstable depth, or screen-door grain.
- Preserve realistic medical colors: warm natural avatar, ivory bone, deep/bright red arteries, and restrained cortex color.
- Keep lighting glossy enough to communicate three-dimensional anatomy without making the structures look plastic.
- Scrubbing should remain fluid in both directions and should not depend on frame rate.
- Keep the existing orbit, zoom, reset, routing, section cameras, hotspots, keyboard support, reduced-motion behavior, accessibility labels, and mobile layout functional.

ACCEPTANCE CRITERIA

Please verify at least these slider positions:

- 0: complete avatar
- approximately 20: glassy avatar with anatomy beginning to emerge
- 34: bone-dominant state
- approximately 52–60: polished bone-and-vessel CTA state
- 68: vessel-dominant state with some receding bone
- approximately 85: vessels transitioning into cortex
- 100: cortex plus major vascular tree

Also verify:

- smooth continuous scrubbing from 0→100 and 100→0;
- no geometry movement or camera movement caused by the slider;
- no abrupt visibility changes at the four labeled stops;
- no horizontal wipe;
- no distracting flicker, random speckling, or transparency artifacts;
- acceptable desktop and mobile performance;
- existing automated tests, production build, and relevant browser checks pass.

WORKFLOW

Implement this on a separate branch and prepare a preview for me. Do not merge it into the production branch or deploy it to the live production site until I approve the preview.

Before coding, briefly relay your understanding of the desired effect and identify any repository-specific constraints you find. If the existing model geometry makes a specific part—such as true vessel-thickness-based erosion—impractical, explain the closest visually convincing alternative instead of silently weakening the effect.

Once the implementation and visual QA are complete, send me the preview link and summarize what changed, what was verified, and any remaining limitations.