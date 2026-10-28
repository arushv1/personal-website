# VascuPath brain-slice explorer

The project entry smoothly zooms from the current Projects view into a focused brain on the right, with research figures on the left. The vessel tree fades out so the brain is the visual focus. Select the coronal slice with the pointer, press Enter/Space on the canvas, or use **Explore the slice**. The slice moves to screen-left beside the cortex and opens a research-image inspector. **Back to brain** returns it; **Close** or Escape returns to the project reader by retracting the slab and reversing the same camera zoom to the preserved atlas view. Custom rotation, zoom and slider settings remain intact.

Arush approved preview `8348154` on October 28 and requested release to main and Vercel through PR #5. The feature was built on `codex/vascupath-brain-slice`, based on the approved density release `ba60076`. Verify the main merge commit’s CI and Vercel status for release completion. The selected visual target is `reference/vascupath-brain-slice.png`; the supplied presentation’s actual figures take precedence over the generated concept imagery.

## Research figures

Arush supplied `Vyas.Arush.Final.pptx`. The served figures under `public/vascupath/` are exact extracted media, without repainting or added predictions. Their original names, dimensions and SHA-256 hashes are recorded in that folder’s README. The 1400×870 prediction JPEG is the sharpest copy embedded in the presentation; slides 1 and 3 reuse it. The inspector aligns its rendered position/width to device pixels and provides the full source without artificial upscaling.

- **Original / Predictions** show paired views of the same section and share pan, zoom and selected-region position. Prediction colors indicate white matter, grey matter and vessels.
- **Attention** shows the complete separate source figure, with paired tissue examples and its percentile scale. Its inspection state is separate. The source is 612×432 pixels; zooming cannot add detail.
- The magnifier enlarges the source image around the selected region. Its 3× label describes display magnification, not a calibrated microscope scale.

Add or replace figures in `src/content/vascupath.mjs`. Each entry supplies an `id`, `label`, `src`, original pixel `width`/`height`, `alt`, and `caption`. An optional `legend` supplies classification labels/colors. Share a `viewGroup` only for aligned images of the same section; use a separate group for an independent figure. Put the original files in `public/vascupath/`. Keep the existing `original` and `predictions` IDs for the default pairing.

The project’s `experience:'brain-slice'` field in `src/content/portfolio.mjs` enables its entry button. Other project content remains data-driven.

## Anatomy and rendering

`BrainSliceController.mjs` works inside the existing `AnatomyScene` using its renderer, canvas, camera and loaded cortex/arteries. The native dialog temporarily owns the same canvas DOM node so it remains interactive rather than being made inert outside the dialog. Its original host stays sized. Desktop position, draw-buffer size and projection dimensions remain fixed through the entire flight; mobile uses one responsive sizing change and follows its scrolling placeholder. There is no second WebGL context, model reload or per-frame CSS resizing.

`DensityRenderer.focus` fades other structures while the shared camera zooms directly toward the source brain. At full focus only cortex and the optional extracted slice require captures; returning reverses the camera and brings the tree back near the end. Source cortex highlight and gap uniforms default to zero. The slab uses a real trimmed band of the existing cortex plus an explicitly illustrative convex cap textured with the supplied tissue image. It has a dedicated depth/color capture in the same compositor, so it retains normal anatomical occlusion. Optional resources are precompiled offscreen and disposed when the explorer closes. The normal density transfer function is unchanged.

The figure panel opens from the brain side using a clipped image aperture, a narrow red sweep and staggered captions/controls. These are transforms/opacity/clip animations; no 3D viewport dimensions change to reveal them. Reduced-motion preference disables those effects. The retained `?reveal=blend` / `?reveal=section` comparisons keep their normal atlas and offer research figures without the density-specific slice.

The anatomical position and filled interior are illustrative navigation. The source GLB contains an outer pial surface, and the research figures are not spatially registered to it. The artery thickness sidecar supplies a relative structural display weight for retaining major vessels; it is not a clinical caliber measurement.

The explorer loads on demand, disposes only its optional slice resources on exit, respects reduced motion, and provides word-labeled controls, keyboard selection and image navigation. Research figures remain accessible through the primary button if 3D is unavailable. Closing restores body scrolling and focus. Route changes cancel the session and return the same canvas to its original host.

## Verify

```bash
npm run build
npm run test:sites
npm run test:regression
PREVIEW_URL=http://127.0.0.1:5182 node tests/browser-vascupath.cjs
PREVIEW_URL=http://127.0.0.1:5182 node tests/browser-smoke.cjs
```

Review the newest VascuPath section of `design-qa.md` and `qa/vascupath/` for browser evidence. Software Chromium measurements do not establish physical phone/GPU performance.
