# Scan interactions: scroll-driven opening, scan overlay, hover previews, blood flow, scan sweep

Arush requested these three on November 10, 2026, together with a header résumé link. They were built on `claude/content-and-scan-interactions`, and Arush approved the preview for release to `main` on November 11 (PR #8).

After reviewing the first preview the same day, Arush asked for two more: **blood flow in the vessels** (pulsing for a few beats after a view settles) and a **scan-sweep transition on the text side as a true wipe**. Both are described below. He also asked for the caption sentences, the atlas "Now" bar and the long glossary to be cut back; see `AGENTS.md`.

## Scroll-driven opening (home only)

Scrolling the home page peels the avatar through the same four layers as the slider: You (0), Bone (34), Vessels (72), Within (100). Each internal layer shows a label and one word, and "Explore the atlas" stays in place throughout.

- **One state.** The page position and the "Look within" slider are two controls for one `reveal` value. Scrolling moves the slider; dragging the slider, pressing a layer button or Reset moves the page to the matching position. `introReveal()` and `introProgressFor()` in `src/intro.mjs` are exact inverses for every whole value, which is regression-tested.
- **Pinned, not hijacked.** The hero is made tall (240svh of travel on desktop, 210svh on phones) and the headline column and model are `position: sticky`. Native scrolling does the rest: no wheel listeners on the page, no scroll snapping, no smoothing library. On desktop the header is sticky too, so nothing moves while a layer changes.
- **Rests.** Each layer holds for 16% of a segment either side of its stop, so a caption can be read before the next transfer starts. The last 6% of the travel is spare so Within settles before the footer arrives.
- **Captions** come from `introCaptions` in `src/intro.mjs`: Bone → "Structure", Vessels → "Flow", Within → "Ideas". Arush removed the supporting sentence that first sat under each word, so keep them to the layer label and a single word. The caption shown always follows the reveal value, so the slider alone changes it too.
- **Phones.** The headline scrolls away first. The model then pins 8px from the top with its controls, and the caption overlays the lower part of the model. The canvas height is capped so the pinned model and controls always fit the screen.
- **Idle rotation.** Scrolling pauses the idle turn and eases the camera back to the opening angle, so layers peel from a face-on view. Returning to the top resumes the turn if scrolling was what paused it.
- **Wheel over the model.** On home, a plain wheel over the model now scrolls the page instead of zooming, because otherwise half the screen would not respond to scrolling. Ctrl/⌘ + wheel and trackpad pinch still zoom, as do the Zoom buttons and the keyboard. Everywhere else (atlas, sections) wheel zoom is unchanged. The hint under the model says which applies.
- **Reduced motion.** With `prefers-reduced-motion: reduce` there is no scroll track at all. The home page is the same height as before and the slider is the only control. Captions still follow the slider.
- **Hotspots.** The opening stays free of section dots and labels at every layer, as decided on October 27.

This adds two things to the previously minimal opening: a small "Scroll to look within" cue under the action (hidden once a layer is showing) and the scan overlay below. Arush asked for both features; the cue exists because a scroll interaction with no signal is not discoverable.

Tuning: track length is `min-height` on `.has-intro .hero` (desktop) and the `::after` height (phones) in `src/styles.css`. Hold and stops are in `src/intro.mjs`.

## Scan-viewer overlay

Small monospace readouts sit in the corners of the model view, in the manner of a medical image viewer. They appear in every view, including home.

| Corner | Readout | Source |
| --- | --- | --- |
| Top left | `VYAS, ARUSH` · `STUDY · PERSONAL ATLAS` · `ILLUSTRATIVE MODEL` | Fixed text |
| Top right | `SERIES · LOOK WITHIN` · `LAYER · BONE` | Current layer |
| Bottom left | `IM 034 / 100` · `ZOOM 1.00×` | Reveal value; camera distance relative to the opening pose |
| Bottom right | `VIEW · FRONTAL CORTEX` · `AZ +017° EL +06°` | Active section's region (or `PREVIEW ·` while hovering); camera angles |
| Left / right edge | `R` `L` `A` `P` | Which side of the subject faces each screen edge |

- Every changing value is computed from the live scene by `scanReadout()` in `src/scan.mjs`. Nothing imitates patient data, dates or scanner settings, and `ILLUSTRATIVE MODEL` keeps the existing position that this is not Arush's scan.
- Orientation letters follow the radiology convention: in a frontal view the subject's left is on the right-hand edge of the screen. They update as the model turns.
- The overlay is `aria-hidden`. The same information is already exposed through the slider's value text and the canvas description.
- `AnatomyScene.jsx` writes the text directly to the DOM once per frame and only when a string changes; it does not re-render React or redraw the 3D scene.
- Section labels now keep clear of the top and bottom readouts (`layoutHotspots(..., {top, bottom})`), and give that space back on a canvas too short to fit all seven labels.
- The loading message reads "Acquiring series n / 4" (the four models).
- It hides during the VascuPath brain-slice explorer.

## Hover previews

Hovering a section label (or giving it keyboard focus), or hovering a row in the atlas list, previews that section before any click.

- **Glow.** The section's anchor dot gains a soft pulsing red halo. This is a screen-space glow at the projected anchor, not a change to the 3D materials, so the approved density reveal is untouched.
- **Lean.** The camera eases a few degrees toward that section's preset: at most about 10° around, 5° up or down, and 4% closer (`peekPose()` in `src/scan.mjs`). It never reaches the preset; clicking does that, exactly as before.
- **Return.** Leaving the label eases back to the pose the visitor had. Clicking, orbiting, zooming or moving the slider cancels the preview and keeps control with the visitor.
- **Still labels.** While a preview is active the label positions are frozen; only the dots and connector lines follow the model. Without this, the label under the pointer could slide away and flicker.
- The bottom-right readout shows `PREVIEW · <region>` meanwhile.
- Touch has no hover, so phones are unchanged. With reduced motion the glow is static and the camera does not move.

## Blood flow in the vessels

Arush chose this on November 10 with the first timing option: **a few beats after each view settles**.

A soft pulse of light travels along the arteries, away from the heart. It starts about a third of a second after a view comes to rest with vessels showing (reveal 44 or higher), runs for 6.3 seconds (seven beats at 0.9 s), fades out, and the scene goes idle again. Any movement (orbit, zoom, slider, section change, hover preview) ends it at once, and it starts again when the view next settles. It does not run while the model is auto-rotating, in the brain-slice explorer, or for visitors who prefer reduced motion.

How it works:

1. **Baked path length.** `scripts/bake-flow.mjs` (`npm run prepare:flow`) gives every artery vertex its path length along the mesh from the lowest part of the ascending aorta, normalised to one byte, in `public/models/flow/arteries.bin` (129,527 bytes; `manifest.json` records the source model hash). The source model is hundreds of separate tube segments, so the script welds coincident vertices and joins points within a small radius before running a shortest-path search. This is an illustrative display weight, **not** a blood-flow measurement or simulation, and no vertex is moved.
2. **Carried in an existing channel.** The artery surface buffers stored a constant 1 in their alpha channel. For arteries that channel now holds the path length (`0.5 + 0.5 × value`), so no extra render target or memory is needed. The compositor decodes it and restores alpha to 1 before the approved density maths runs, so the reveal itself is unchanged.
3. **One pass per frame.** In the final composite, a travelling band brightens the artery colour: a sharp leading edge with a tail fading back toward the heart. `flowWaves` in `DensityRenderer.mjs` sets how many fronts span the tree. Because it reads cached buffers, a pulse frame redraws no geometry (the browser test asserts the capture count does not change).
4. **Courses map.** Selecting a connection sends one bright dash along that vessel from the course branch to the work. It plays once (`.course-flow` in `course-map.css`) and never loops.

Tuning lives at the top of the effect in `AnatomyScene.jsx`: `flowSeconds`, `flowBeat`, `flowPeak` (0.42; it was softened from 0.62 after the first look). The pulse exists only in the default density reveal; `?reveal=section` and `?reveal=blend` do not have it. If the weights file is missing the site works normally without a pulse. Re-run `npm run prepare:flow` if `arteries.glb` ever changes; a regression test checks the vertex count and model hash.

Not measured: cost on a physical phone. During a pulse the still view is composited every frame at full resolution for about six seconds.

## Scan-sweep transition (text column, true wipe)

Arush asked for the scan sweep "to the text side, true wipe". When the route changes (home, atlas or any section, including Back and Forward), a thin red line with a faint glow travels down the text column in about 0.8 seconds. Below the line the old text is still there; above it the new text has replaced it. The corner readout says `ACQUIRING · <view>` until the line finishes.

The 3D model is deliberately **not** part of the wipe. It keeps its approved camera glide and layer transfer. A true wipe of the model would need the camera to hold still and would change the approved reveal; that remains an open option, not something built.

How it works:

- `changeRoute()` in `App.jsx` uses the browser's View Transitions API. It marks `<html data-wipe>`, which gives the text column (`.hero-copy`, `.atlas-intro` or `.chapter-content`) a transition name, so the browser snapshots the old column, applies the route change, and snapshots the new one.
- CSS at the end of `styles.css` clips the two snapshots against a moving edge: the old one from the top down, the new one from the bottom up, both driven by `--wipe-from` and `--wipe-to` (the visible part of the column, measured after the change). A fixed 2px element with the same travel is the line. `--wipe-ms` and `--wipe-ease` set the timing.
- The rest of the page is excluded from the animation and changes at once, exactly as before. The transition overlay ignores pointer events, and the new content is live in the page from the first frame, so nothing waits on the sweep.
- A second navigation during a sweep ends it and starts the next one.
- The history entry is pushed in the same step as the content change, so the address and the page never disagree.

Fallbacks: reduced motion, an open dialog, or a browser without `document.startViewTransition` (older Firefox and Safari) get today's immediate change.

One consequence to know: the route change now lands one frame after the click, because the browser must capture the old column first. Manual input in that single frame (for example a key pressed on the model immediately after clicking a label) can be overridden by the section's camera move. `tests/browser-scene.cjs` now waits for the address before its interruption check.

## Verification

```bash
npm run test:regression                      # includes tests/interactions.test.mjs
PREVIEW_URL=http://127.0.0.1:5173 node tests/browser-interactions.cjs
```

`tests/interactions.test.mjs` covers the scroll mapping and its inverse, readout formatting and orientation, preview limits for every pair of section views, label insets, the blood-flow weights and the new content fields. `tests/browser-interactions.cjs` (optional, needs Playwright and Chromium like the other browser suites) covers the pinned opening on desktop, 390px and 320px, wheel versus Ctrl+wheel, slider/page agreement, the overlay, previews, the scan sweep, the blood-flow pulse, the résumé link, write-ups, key terms, the poster viewer, course catalog text and reduced motion. Evidence from the November 10 run is in `qa/scan-interactions/`.

Not established: smoothness on a physical phone or a low-power GPU, and any browser other than Chrome. The checks ran in a software-rendered browser, which shows correct states and layout but not real frame rates.
