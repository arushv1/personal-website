# VascuPath brain-slice prototype

The project entry smoothly flies from the current Projects view into a focused brain on the right, with research figures on the left. The vessel tree fades out so the brain is the visual focus. Select the coronal slice with the pointer, press Enter/Space on the canvas, or use **Explore the slice**. The slice moves to screen-left beside the cortex and opens a research-image inspector. **Back to brain** returns it; **Close** or Escape returns to the project reader by retracting the slab and reversing the camera/canvas flight to the preserved atlas view. Custom rotation, zoom and slider settings remain intact.

This is a prototype on `codex/vascupath-brain-slice`, based on the approved density release `ba60076`. Production remains separate. The selected visual target is `reference/vascupath-brain-slice.png`; the supplied presentation’s actual figures take precedence over the generated concept imagery.

## Research figures

Arush supplied `Vyas.Arush.Final.pptx`. The served figures under `public/vascupath/` are exact extracted media, without repainting or added predictions. Their original names, dimensions and SHA-256 hashes are recorded in that folder’s README. The 1400×870 prediction JPEG is the sharpest copy embedded in the presentation; slides 1 and 3 reuse it. The inspector aligns its rendered position/width to device pixels and provides the full source without artificial upscaling.

- **Original / Predictions** show paired views of the same section and share pan, zoom and selected-region position. Prediction colors indicate white matter, grey matter and vessels.
- **Attention** shows the complete separate source figure, with paired tissue examples and its percentile scale. Its inspection state is separate. The source is 612×432 pixels; zooming cannot add detail.
- The magnifier enlarges the source image around the selected region. Its 3× label describes display magnification, not a calibrated microscope scale.

Add or replace figures in `src/content/vascupath.mjs`. Each entry supplies an `id`, `label`, `src`, original pixel `width`/`height`, `alt`, and `caption`. An optional `legend` supplies classification labels/colors. Share a `viewGroup` only for aligned images of the same section; use a separate group for an independent figure. Put the original files in `public/vascupath/`. Keep the existing `original` and `predictions` IDs for the default pairing.

The project’s `experience:'brain-slice'` field in `src/content/portfolio.mjs` enables its entry button. Other project content remains data-driven.

## Anatomy and rendering

`BrainSliceScene.jsx` uses a separate, temporary normal-depth Three.js scene and loads the existing cortex/artery GLBs with the same shared registration. It does not alter the live density renderer or its cached surfaces. `AnatomyScene.getView()` supplies an immutable camera/target snapshot and the source canvas rectangle. The explorer animates its temporary canvas between that rectangle and the right-hand stage; resize observes the actual animated dimensions, keeping the projection proportional. Closing reverses the extraction, restores the camera exactly, and returns to the current atlas rectangle, including after a viewport resize. Scrollbar compensation keeps the underlying page layout steady. The source cortex supplies the selected slab; a convex section contour closes an illustrative cap textured with the supplied tissue image. The original cortical band opens into a narrow slot as the slab moves. The remainder of the brain stays stationary.

The anatomical position and filled interior are illustrative navigation. The source GLB contains an outer pial surface, and the research figures are not spatially registered to it. The artery thickness sidecar supplies a relative structural display weight for retaining major vessels; it is not a clinical caliber measurement.

The explorer loads on demand, disposes its GPU resources on exit, respects reduced motion, and provides word-labeled controls, keyboard selection and image navigation. Research figures remain accessible through the primary button if 3D is unavailable. Closing restores body scrolling and focus. The extra scene is unmounted on route changes.

## Verify

```bash
npm run build
npm run test:sites
npm run test:regression
PREVIEW_URL=http://127.0.0.1:5182 node tests/browser-vascupath.cjs
PREVIEW_URL=http://127.0.0.1:5182 node tests/browser-smoke.cjs
```

Review the newest VascuPath section of `design-qa.md` and `qa/vascupath/` for browser evidence. Software Chromium measurements do not establish physical phone/GPU performance.
