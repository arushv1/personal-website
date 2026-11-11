# Scan interactions: scroll-driven opening, scan-viewer overlay, hover previews

Arush requested these three on November 10, 2026, together with a header résumé link. They live on `claude/content-and-scan-interactions` as a preview. Nothing here is released to `main` or production until Arush approves the preview.

Two related ideas are described at the end as proposals only. Arush asked for an explanation before any change: **blood flow in the vessels** and a **scan-sweep section transition**. Do not build either without his go-ahead.

## Scroll-driven opening (home only)

Scrolling the home page peels the avatar through the same four layers as the slider: You (0), Bone (34), Vessels (72), Within (100). A caption names what each layer opens in the atlas, and "Explore the atlas" stays in place throughout.

- **One state.** The page position and the "Look within" slider are two controls for one `reveal` value. Scrolling moves the slider; dragging the slider, pressing a layer button or Reset moves the page to the matching position. `introReveal()` and `introProgressFor()` in `src/intro.mjs` are exact inverses for every whole value, which is regression-tested.
- **Pinned, not hijacked.** The hero is made tall (240svh of travel on desktop, 210svh on phones) and the headline column and model are `position: sticky`. Native scrolling does the rest: no wheel listeners on the page, no scroll snapping, no smoothing library. On desktop the header is sticky too, so nothing moves while a layer changes.
- **Rests.** Each layer holds for 16% of a segment either side of its stop, so a caption can be read before the next transfer starts. The last 6% of the travel is spare so Within settles before the footer arrives.
- **Captions** come from `introCaptions` in `src/intro.mjs`: Bone → "Structure", Vessels → "Flow", Within → "Ideas". Each line names the sections that open from that structure, matching the section presets in `portfolio.mjs`. The caption shown always follows the reveal value, so the slider alone changes it too.
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

## Verification

```bash
npm run test:regression                      # includes tests/interactions.test.mjs
PREVIEW_URL=http://127.0.0.1:5173 node tests/browser-interactions.cjs
```

`tests/interactions.test.mjs` covers the scroll mapping and its inverse, readout formatting and orientation, preview limits for every pair of section views, label insets and the new content fields. `tests/browser-interactions.cjs` (optional, needs Playwright and Chromium like the other browser suites) covers the pinned opening on desktop, 390px and 320px, wheel versus Ctrl+wheel, slider/page agreement, the overlay, previews, the résumé link, write-ups, the glossary, the poster viewer, course catalog text and reduced motion. Evidence from the November 10 run is in `qa/scan-interactions/`.

Not established: smoothness on a physical phone or a low-power GPU. The checks ran in a software-rendered browser, which shows correct states and layout but not real frame rates.

## Proposed, not built

### Blood flow in the vessels

A soft pulse of light that travels along the arteries, away from the heart, in time with a resting heartbeat.

How it would work:

1. **Bake a "distance from the heart" value for every artery vertex**, once, the same way `scripts/bake-density.mjs` bakes thickness: walk the mesh outward from the aortic root and store the normalized path length in a small sidecar file (roughly 120–240 KB).
2. **Carry that value through the existing artery capture** into the density compositor, which already holds per-pixel buffers for each layer.
3. **Add a moving highlight in the final composite pass**: pixels whose distance value falls inside a narrow travelling band are brightened. Because it reads cached buffers, one pulse frame costs one full-screen pass, the same as scrubbing the slider. No geometry is redrawn.
4. **Courses map**: when a connection is selected, a bright dash runs once along that SVG vessel from the course branch to the project.

Choices for Arush:

- **When it runs.** The scene currently stops drawing when nothing moves, which saves battery. A permanent pulse ends that. Options: pulse for a few seconds after a view settles; pulse only in the Vessels range and Experience; or always on.
- **Strength and pace.** Barely visible and slow reads as "alive"; stronger reads as decoration.
- It would be off for reduced motion, paused by the existing Pause control and when the tab is hidden, and absent from the two older comparison reveals.

Risk: phone GPU cost is unmeasured, and a new baked asset must stay in sync with the artery model.

### Scan-sweep section transition

When the section changes, a thin red line sweeps down the model like a scanner plane, and the new section's text appears behind it.

Sequence, about 0.7–0.9 seconds:

1. The old text fades quickly. A 2px red line with a faint trailing band appears at the top of the model view.
2. The line travels top to bottom. In step with it, the new heading and entries are uncovered from the top by a clip that follows the line, so the text "prints" as the scan passes. The overlay reads `ACQUIRING` and then the new view name.
3. The line fades at the bottom and focus moves to the new heading, as it does today.

Two ways to treat the model during the sweep:

- **Cosmetic sweep (recommended first).** The line is an overlay. The camera glide and layer transfer continue exactly as approved. Cheap, and it cannot disturb the density reveal.
- **True wipe.** The compositor shows the new layer state above the line and the old one below. This needs the camera to hold still during the sweep (its cached buffers are per pose) and changes how the approved continuous reveal behaves during navigation.

Rules either way: a second click restarts from the current state; Back and Forward use the same transition; the new content is in the page and clickable immediately; reduced motion keeps today's instant change.

Choices for Arush: cosmetic or true wipe; top-to-bottom or side-to-side; duration; every section change or only the first entry from the atlas.
