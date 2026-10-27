# Design QA — Arush's personal atlas

## Source and implementation

- Source visual truth: `reference/selected-option.png`, revised option 1 selected by the user. Source pixels: 1536 × 1024.
- Implementation: http://127.0.0.1:5173/.
- Final implementation screenshot: `qa/desktop-final.jpg`.
- Final state: introduction, reveal 28, camera near its starting side view, rotation paused for comparison, page scroll 0.
- Desktop CSS viewport: 1536 × 1024. The browser capture service returned a 1521 × 1014 JPEG. The reference was normalized to the same pixel dimensions with its aspect ratio preserved; both panels use the same scale. No browser chrome or device frame is included.
- The anatomy is real sourced geometry rather than the generated illustration. Exact contours and vessel distribution differ intentionally; bone, arteries, and cortex must register and remain coherent during free orbit and reveal. This is a generic model, not Arush's likeness or scan.

## Comparison evidence

- Full-view joint comparison: `qa/comparison-final.jpg`, containing the normalized source and implementation in the same image.
- Focused type/action comparison: `qa/typography-comparison.jpg`, source and implementation crops in the same image.
- Reveal evidence: `qa/reveal-final.jpg` (the directly sourced final cortex, full reveal).
- Hotspot-to-chapter evidence: `qa/chapter-final.jpg`.
- Direct manipulation evidence: `qa/orbit-and-zoom.jpg`.
- Mobile evidence: `qa/mobile-home.jpg`, `qa/mobile-chapter.jpg`, and `qa/minimum-320.jpg`.
- Short desktop evidence: `qa/laptop-1366.jpg`.

## Required fidelity surfaces

**Fonts and typography:** Inter loaded successfully (verified through the browser font API). Bold sans-serif display hierarchy, three-line title, white/red punctuation, navigation scale, supporting text, and action hierarchy match the selected direction. Tracking, display line-height, and left inset were adjusted after the initial comparison. Copy remains editable HTML.

**Spacing and layout rhythm:** Header, left copy, right anatomy, action, gesture hint, and reveal controls retain the reference's proportions and grouping. The source has an illustrated head with different anatomical proportions; the actual mesh is kept unwarped. The controls remain within a 1366 × 768 viewport (bottom 755px), and the action ends at 667.7px. Mobile reflows into copy then model without horizontal overflow.

**Colors and tokens:** Black background, ivory matte bone, red vessels/action, and white/gray typography retain the reference palette. Button and selected-state red were darkened slightly for readable white text. Model tone varies naturally with lighting/orbit. No decorative raster background or cinematic effects were substituted.

**Image/model quality:** Real attributed 3D assets are used, with no CSS/div/SVG anatomy approximations and no flat hero picture rotated to mimic 3D. Head/neck skeletal and arterial meshes are selected from the source atlas and registered together. The cortical mesh is directly sourced from Brainder with its license/attribution recorded. Final assets: bone 136,392 triangles, arteries 233,689, cortex 115,804. Three compressed GLBs total approximately 1.5 MB. Crops retain the head and relevant upper thorax, and no placeholder imagery remains.

**Copy and content:** Title, supporting line, action, navigation, hint, and reveal labels follow the selected mock. Additional chapter copy uses the user's supplied interests and résumé. No invented project metrics, hardware, favorite places, or personal photographs are presented as facts. Generic anatomy and symbolic chapter locations are explained in Model credits.

**Icons and controls:** Phosphor icons provide the arrow, mouse hint, pause/play, reset, zoom, close, and contact glyphs. Native range and buttons provide keyboard access. Focus, pressed/selected chapter states, loading, retry, unavailable-WebGL fallback, and dialog states are implemented. Core navigation is functional.

## Interaction verification

- Initial anatomy loads and automatic motion can be paused/resumed.
- Pointer drag changes the orbit. Wheel/orbit controls and zoom buttons work; keyboard arrows and plus/minus provide alternatives. Reset returns to the starting view.
- Range endpoints 0 and 100 are keyboard reachable; full reveal exposes cortex and vessels and fades the bone. Visible value and accessible state update.
- Explore within moves to the atlas and exposes all five hotspots/chapters.
- Making hotspot opens its chapter. Research, Roots, Making, Setup, Stories, and About each render the expected heading and content.
- Back-to-atlas and return-home navigation work; focus moves to the chapter heading and returns to the main action on exit.
- Contact opens a native modal with email and LinkedIn links. Close works. Model credits opens with attribution and source-notice links. No email is sent automatically.
- Résumé and public profile links have verified destinations in rendered DOM.
- Browser console checked after a fresh load of the final model: no warnings or errors.
- Responsive checks: 1536 × 1024, 1366 × 768, 390 × 844, and 320 × 800. No horizontal overflow at the narrow or laptop checks.
- Mobile computed touch action is `pan-y`, preserving vertical page scrolling while allowing sideways orbit. Zoom buttons remain available.
- Production build succeeds. The supplied four Sites worker/packaging tests pass. No deployment was performed.

## Comparison history and resolved findings

1. **P2 — Reveal controls below the fold on short desktop windows.** Initial fixed minimum scene height caused this. Fixed scene height and copy padding to follow viewport height. Post-fix laptop capture and measured control bounds confirm the correction.
2. **P2 — Initial intro type too tight/small and left inset too small.** Increased display size, corrected tracking/line-height, restored the reference inset, and matched the wider action. Joint final and focused comparisons show the corrected hierarchy.
3. **P2 — Scapular fragments at the lower model crop.** Removed those structures from the export and reloaded the assets. Final side-view evidence shows a cleaner upper-thorax crop.
4. **P2 — Mobile canvas could intercept vertical scrolling.** Applied mobile `pan-y` and a mobile-specific gesture hint. Verified computed touch action and full-page readable mobile captures.
5. **P2 — Camera easing could compete with a new pointer interaction.** Cancelled pending camera movement when orbit/zoom begins. Direct manipulation and keyboard/zoom checks were repeated after the fix.
6. Final captures were normalized to the source viewport/state, including page scroll 0; earlier scrolled captures were not used to judge vertical alignment.

## Findings

No actionable P0/P1/P2 findings remain for this prototype's scope.

## Follow-up polish and limits

- P3: The sourced anatomical mesh has a narrower cranial contour and different superficial branches than the generated illustration. A custom art-directed or personal likeness can refine this later; the current model preserves coherent real 3D anatomy.
- P3: Small footer text may wrap to multiple lines at the narrowest width, while links remain reachable.
- Physical phone GPU performance and two-finger gestures were not measured; mobile viewport, layout, touch-action, and accessible alternatives were checked in the in-app browser.
- Reduced-motion handling is implemented in CSS and scene initialization; an OS-level preference toggle was not emulated during this run.
- Personal copy is a draft; photos, detailed case studies, and actual desk specifications were not supplied.

## Implementation checklist

- [x] Match selected visual direction and exact top-level copy.
- [x] Use real 3D models and working navigation/layer controls.
- [x] Optimize and attribute selected assets.
- [x] Check responsive layouts and primary interactions.
- [x] Compare the actual implementation to the selected visual in a joint input.
- [x] Preserve the Product Design / Sites-ready runtime and verify build output.

final result: passed
