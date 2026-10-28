# Global density reveal — review preview

Branch: `codex/density-reveal`. The implementation follows [Arush’s brief](DENSITY-BRIEF.md). Publishing this branch creates a **preview only**. Do not merge or promote it until Arush approves the preview.

## Behavior

The labels remain You (0), Bone (34), Vessels (68), Within (100). One continuous reveal value controls a stable synthetic field across all four registered meshes:

- **0–15:** the original opaque, textured avatar, rendered at full resolution.
- **15–34:** a translucent/rim-lit avatar develops broad connected holes while bone and faint vessels emerge.
- **34–52:** bone dominates and vessels build up.
- **52–65:** overlapping ivory bone and red arteries form the CTA-style view.
- **65–74:** thinner bone recedes; vessels dominate. Vascular erosion begins around 68.
- **74–100:** cortex emerges while fine vessels erode, leaving cortex with the major vascular tree.

Individual regions vary with their density and thickness proxies. These ranges are overlapping transfer functions, not completed scenes that fade into one another. There is no height cut, random pixel mask, animated noise, vertex displacement or density-driven camera movement. Both prior comparisons remain at `?reveal=section` and `?reveal=blend`; native links preserve them. `?reveal=density` explicitly selects this branch’s default.

## Implementation

`DensityReveal.mjs` samples one deterministic world-space field into normalized vertex attributes after the existing registration. The per-pixel shader adds a small smooth, stationary spatial variation and applies soft thresholds. Avatar translucency includes a restrained rim contribution. Bone has thickness-weighted retention; arteries use a stronger thickness term so small branches disappear ahead of central trunks.

`scripts/bake-density.mjs` estimates local mesh thickness with normal-directed rays accelerated by a triangle BVH. Three one-ring smoothing passes suppress isolated errors. It produces separate normalized Uint16 attributes in `public/models/density/`, leaving the source GLBs untouched. The manifest records source hashes, vertex counts and estimation statistics. Inward rays needed an alternate direction or fallback at approximately 1.15% of bone vertices and 4.42% of artery vertices. These are relative geometric display weights, not calibrated radii, CT intensities or HU.

`DensityRenderer.mjs` renders surface color, depth, density and structural attributes from the **same anatomical scene** into reusable buffers. Captures comprise one avatar surface, two bone depths, two arterial depths, an additional major-vessel capture, and one cortex surface. The major-vessel capture protects large trunks hidden by fine foreground branches. A per-pixel shader recomputes the masks and sorts contributing surfaces by depth on every reveal change. Duplicate arterial captures are suppressed. Camera/projection/size changes invalidate these buffers; stationary density scrubbing does not rerender the meshes. The opaque 0–15 range uses the normal scene renderer.

Composition uses a 70%-resolution intermediate, a bounded edge filter, and one final tone/color transform. This controls fragment cost without simplifying or moving geometry. DPR is capped at 1.5 desktop and 1.25 mobile. Shaders are prewarmed before controls enable; browsers without parallel compilation use synchronous compilation. An RGBA8 color fallback is available without floating-point color buffers. All render targets, materials, textures and geometry are disposed through the scene lifecycle.

## Limits

- This is a surface-based visual approximation. It does not integrate a CT volume or simulate measured tissue density, true volumetric scattering, or physical refraction.
- The depth capture count is finite. More deeply occluded surfaces within one anatomical mesh can be absent after foreground erosion. The extra major-vessel capture mitigates this for trunks; it is not a full anatomical reconstruction.
- Thickness is estimated from simplified geometry, with smoothed fallbacks at open/inconsistent surfaces. There are no source centerlines or clinical caliber labels.
- The density intermediate softens fine details relative to native resolution. The opaque avatar retains full-resolution rendering.
- Cloud Chromium uses SwiftShader. Software timings are recorded separately and do not establish physical desktop/phone GPU frame rates or pinch behavior.

## Reproduce

```bash
npm run build
npm run test:sites
npm run test:regression
npm run dev -- --port 5180
```

With Playwright and Chromium installed:

```bash
PREVIEW_URL=http://127.0.0.1:5180 node tests/browser-density.cjs
PREVIEW_URL=http://127.0.0.1:5180 node tests/browser-smoke.cjs
PREVIEW_URL=http://127.0.0.1:5180 node tests/browser-scene.cjs
```

Rebake only after changing bone/artery source models:

```bash
npm run prepare:density
```

The asset regression checks reject mismatched source hashes/counts. Browser density checks verify required states, forward/reverse pixel equality, unchanged geometry/camera/lighting, continuity at stops, temporal stability, whole-model changes, narrow layouts and the RGBA8 fallback. Review `qa/density-reveal/` and the latest `design-qa.md` entry for evidence and measured limits.
