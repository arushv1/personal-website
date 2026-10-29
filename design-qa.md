# Design QA — Arush's real 3D avatar

## Findings

No actionable P0/P1/P2 findings remain for this update. A mobile chapter navigation issue found during verification was corrected and checked again. The internal anatomy remains generic and illustrative; the outer avatar is an artistic likeness, not a face or medical scan.

## Source, state, and normalization

- Layout source: the previously accepted implementation, `qa/desktop-final.jpg`, grounded in `reference/selected-option.png`. The earlier anatomy QA report is retained as `qa/anatomy-design-qa.md`.
- Character art direction: the user's `reference/3d-avatar-style.png` and the generated likeness concept, `reference/arush-avatar-concept-v1.png` (1122 × 1402 RGBA). The latter was the actual Meshy generation input.
- Implementation: http://127.0.0.1:5173/; home, reveal 0 / You, rotation paused, reset camera, page scroll 0. Final screenshot: `qa/avatar-home-final.jpg`.
- Desktop CSS viewport 1536 × 1024. Both baseline and new browser captures are 1521 × 1014 pixels. The browser capture service scales the viewport; the comparison uses equal-sized captures directly, with a 16 px separator and no browser chrome.
- Full-view comparison: `qa/avatar-layout-comparison.jpg`, accepted baseline on the left and new avatar implementation on the right. Avatar subject, frontal three-quarter camera, shorter-neck registration, and the four layer shortcuts intentionally replace the old generic side-profile opening.
- Focused typography/action comparison: `qa/avatar-typography-comparison.jpg`, identical 510 × 540 crops from both browser captures.
- Focused character comparison: `qa/avatar-likeness-comparison.jpg`, concept on the left and actual front-facing browser model on the right. The concept was trimmed to its transparent subject; the model was cropped from `qa/avatar-front-final.jpg`. Each subject was fitted proportionally into 512 × 640 on black. This compares stylization and identity cues rather than identical camera/lighting pixels.
- All three joint comparison images were opened and visually reviewed together with the actual browser states. Separate source and output images were not treated as a joint comparison.

## Required fidelity surfaces

**Fonts and typography:** The focused comparison preserves the accepted display font, three-line wrapping, bold weight, tracking, line height, red period, supporting copy, and red action. Navigation and small controls retain the existing hierarchy. The new layer labels remain readable at narrow widths; no text truncation or horizontal overflow was observed.

**Spacing and layout rhythm:** The full-view comparison preserves header, left copy, action, right scene, and bottom-control grouping. The avatar fits the scene as a complete head/neck/shoulder bust. At 1366 × 768, the action ends at 667.7 CSS px and scene controls at 755 px. Mobile stacks copy, model, and controls in a vertically scrollable page. At 390 and 320 CSS px, the avatar and controls fit the width without overlap or horizontal overflow. Model zoom is intentionally user-controlled and may enlarge geometry beyond its viewport.

**Colors and tokens:** Black, white, gray, and red interface tokens match the baseline. The avatar adds the requested dark curls, warm skin, silver studs, and blue polo. PBR materials and source texture maps are retained. Scene lighting differs from the concept's studio lighting, so skin highlights and shirt saturation vary; this is a rendered 3D likeness with a different light rig, not a pixel copy of the reference.

**Image/model quality:** The frontend loads an actual textured Meshy GLB, with sculpted head, hair, ears, neck, and collar. Rotation reveals real side/back geometry; no raster portrait plane, projection-color substitute, or portrait-only orbit limit is used. The original textured model is retained. Its web derivative has 124,180 triangles and is 867,268 bytes, preserving UVs, normals, base color, normal, and metallic/roughness maps. Four compressed GLBs total about 2.4 MB. Internal layers share the same world/camera and shorter-neck registration. Slider reversal retains the viewing angle. The normalized character comparison retains the smile, clean-shaven face, curls, earrings, and polo; exact facial proportions remain approximate.

**Copy and content:** Existing headline, subtitle, chapters, and supplied personal details remain intact. Slider labels now describe You → Bone → Vessels → Within. Model credits identify Meshy, its CC BY 4.0 license, optimization, illustrative internal anatomy, and existing anatomical sources. No claims of actual personal scan data or invented project metrics were added.

**Icons and accessibility:** Phosphor controls remain consistent. The range has a descriptive name and changing value text, shortcut buttons expose pressed state, and disabled loading states remain. Canvas keyboard instructions now describe the avatar. Contact and credits remain native dialogs. Chapter headings receive focus; on mobile, newly opened chapter content is also brought into view. Reduced-motion initialization is preserved.

## Browser and interaction evidence

- `qa/avatar-home-final.jpg`: reset three-quarter avatar opening.
- `qa/avatar-front-final.jpg`: front geometry after two keyboard rotation steps.
- `qa/avatar-orbit-final.jpg`: pointer-rotated avatar showing another viewing angle.
- `qa/avatar-bone-final.jpg`, `qa/avatar-vessels-final.jpg`, `qa/avatar-within-final.jpg`: settled reveal stages. Temporary interpolation frames were not used as stage evidence.
- `qa/meshy-textured-preview.jpg`: legitimate textured source in Meshy's 3D viewer, where front, side, and back were inspected before export.
- `qa/avatar-mobile-home.jpg`, `qa/avatar-mobile-controls.jpg`: 390 × 844 CSS viewport; 375 × 812 captures. Vertical scrolling reaches the lower controls. Computed canvas touch action is `pan-y`.
- `qa/avatar-minimum-320.jpg`: 320 × 800 CSS viewport; 305 × 763 capture, no horizontal overflow.
- `qa/avatar-mobile-chapter.jpg`: 390 × 844 CSS viewport; 375 × 812 capture, corrected chapter opening.
- `qa/avatar-laptop-1366.jpg`: 1366 × 768 CSS viewport; 1351 × 760 capture, all scene controls accessible.

Verified avatar loading, automatic rotation/pause, pointer orbit, keyboard rotation, zoom in/out, keyboard Home reset, all four layer shortcuts, range Home/End, reveal reversal, Explore within, Making hotspot, chapter back, About, return home, Contact, and updated Model credits. Browser warning/error log returned an empty array. The frontend serves static models/decoder and has no application API, database, or secret configuration to verify.

## Comparison history and resolved findings

1. **P2 — Mobile hotspot navigation could leave the new chapter heading above the viewport.** The previous focus effect deliberately prevented scrolling on every screen size. A hotspot opened from the lower model changed content above the current scroll position. Fix: preserve desktop focus behavior and scroll the new article into view only on the stacked layout (max-width 760 px). Repeated the hotspot flow after the change: article top 0, heading top 91 px, heading bottom 186.9 px, no overflow. `qa/avatar-mobile-chapter.jpg` shows the post-fix heading and readable content.
2. Final joint layout and focused comparisons show the intended avatar/slider changes with the accepted typography and structure intact. No additional P0/P1/P2 visual finding was identified.

## Build and code verification

- Clean `npm ci --no-audit --no-fund` succeeded with the committed package/lockfile changes.
- Final `npm run build` succeeded; client and optional Sites packaging were emitted.
- Final `npm run test:sites` passed all four tests after that build.
- React review: model requests load in parallel; transient animation values stay in refs; the renderer is not recreated by slider updates; observers, controls, frame callbacks, and loaded scene resources have cleanup. Native controls, accessible value text, loading/retry, and unsupported-WebGL paths remain.
- Vite reports the existing large-JavaScript-chunk advisory (about 226 KB gzip). No build failure. Splitting the initial Three.js scene would not eliminate its required first-view download.
- Publication was verified separately for release `b6b8eaa`: GitHub Actions run `40447894676` passed; Vercel's commit status reported “Deployment has completed.” The public URL https://personal-website-brown-psi-69.vercel.app was reloaded in the browser, and the textured avatar, enabled controls, pause/reset, full reveal, and reverse reveal worked without warning/error logs. `qa/avatar-production-final.jpg` records the live opening at 1305 × 804 CSS px. A local QA pass alone does not prove later deployments.

## Follow-up polish and limits

- P3: The generated mesh's gaze points slightly upward, and facial proportions/lighting differ from the concept. Further likeness sculpting, eye correction, or an actual facial rig can refine this. Current animation is scene rotation/reveal; no blink or lip rig is claimed.
- Physical phone GPU performance and two-finger gestures were not measured. Browser viewport layout, computed touch behavior, scrolling, and control alternatives were checked.
- Reduced-motion handling remains implemented; an OS preference change was not emulated in this run.

## Implementation checklist

- [x] Actual textured 3D avatar with complete rotatable geometry.
- [x] Shared avatar, bone, vessel, and cortex reveal in one scene.
- [x] Preserve original model, reproducible optimization, and attribution.
- [x] Match accepted layout and compare source/implementation in joint inputs.
- [x] Check desktop, short laptop, mobile, keyboard, navigation, and console.
- [x] Repair and recheck the mobile chapter issue.
- [x] Build and run the four packaging tests.

final result: passed

## October 27, 2026 — Cloud chapter routes and sectional reveal

This supersedes the historical reveal pass above for the user's reported choppy/double-face transition.

Implementation:

- Native chapter/atlas/home links, initial URL state, meaningful document titles, pushState navigation and popstate restoration. Re-selecting the current route does not create another entry. Header, atlas list, hotspots and pager share the same destinations.
- `/` is home; `/atlas` is the overview; `/research`, `/roots`, `/making`, `/setup`, `/stories`, `/about` are chapters. Unknown Vite/Sites URLs show a not-found view with home recovery. Vercel rewrites only known app routes; unknown paths retain Vercel's 404. Missing model/decoder/API files do not become HTML in the Sites worker.
- Replaced full-surface transparent crossfades with top-to-bottom sections through the real meshes. Avatar/bone masks are complementary; bone/vessel sections share a second boundary; cortex has the final section. Only the narrow boundary is alpha-hashed. Consistent depth-writing eliminates the prior .98 depth and .005 visibility switches. No generated assets or dependency changes.
- Exponential reveal damping (45 ms time constant) and time-based camera easing. Manual scrubbing/shortcuts pause automatic rotation and cancel camera easing. Lower-thorax compression is shared by internal layers; head placement and original avatar PBR textures stay intact. Idle scenes skip GPU rendering until invalidated.

Verification:

- Node 22.23.4: production build passed. The existing large-chunk advisory remains; the client is approximately 843 kB before gzip.
- Four Sites worker/packaging tests passed, including missing model/decoder requests. Five new regression tests passed for routes, native link semantics, settling/reversal at simulated 20/30/60fps, section ordering, and asset-safe Vercel rewrites.
- Chromium/SwiftShader acceptance suite: direct Research load, refresh, separate tab, home → atlas → Research → Roots → Back twice → Forward twice; no duplicate history on reselection; header, hotspot, pager, atlas/home recovery; keyboard links/focus; Contact and credits dialogs; Ctrl-click new tab; exact same camera/outer-avatar pixels after a 0 → 100 → 0 reveal; orbit/zoom/reset and four shortcuts; four GLBs, decoder and resume all return 200.
- Research layout checked at 1536×1024, 1366×768, 390×844 and 320×800, with no horizontal overflow; mobile heading scroll/focus and `touch-action: pan-y` passed. New evidence lives in `qa/cloud/`.

Visual conclusions and limits:

- Baseline three-quarter frames show the old avatar/skull double-face blend and shoulder protrusion. The sectional approach replaces it with one moving boundary. After frames inspect front, three-quarter, side and rear orientations at reveal 0/15/25/34/50/68/85/100. Within remains cortex and vessels in the same 3D scene.
- A visible anatomical section is intentional. The models have different contours, and the generic skull is not reconstructed from Arush's avatar or a medical scan. This change improves the transition without claiming personalized registration.
- Cloud browser rendering uses software WebGL. Numerical timing checks cover 20/30/60fps; screenshots alone cannot establish motion quality on physical phone GPUs. Pinch gestures and physical phone performance remain unmeasured. Google Fonts is blocked by this environment's network policy; acceptance screenshots use system-font fallback. The pre-existing favicon omission remains.
- The deliverable is a review branch/PR. No production release is claimed. Direct-route behavior on a Vercel preview must be checked separately when the preview is available and accessible.

Motion evidence: `qa/cloud/motion-sequence.jpg` contains 17 real browser samples from slow changes, endpoint jumps and reversals; these are sampled states, not a real-time recording. `qa/cloud/browser-report.json` records no unexpected browser errors and approximately 1.04 browser animation callbacks/second during that software-rendered capture. That rate does **not** verify perceptual smoothness on hardware. After that run, fully section-masked meshes were also culled using geometric bounds plus the feather margin, avoiding the old opacity-threshold visibility switch. Build and regression checks were repeated after that optimization.

Final targeted browser check after geometric culling and inertia handling: pointer drag and wheel zoom visibly changed the canvas; scrubbing drained residual orbit motion; 0 → 100 → 0 returned exactly the same camera/avatar image. The production build and all nine Node checks passed again on this final source state. Comparison sheets were regenerated from a separate original-source preview at the same camera angles; raw captures were kept outside the source tree to keep the review artifacts compact.

Delivery: draft PR #1 (`https://github.com/arushv1/personal-website/pull/1`). GitHub's Vercel status reported success for implementation commit `5c65662b9d4a440da51739439577d95f73481483` (deployment `HPVoxpHF5JSiKs3B2mYZpwcyxsnR`). Vercel API inspection returned 403 because the connected app lacks the target team's grant; a team-access consent link was provided in chat. Deployed chapter refresh/assets verification remains pending that access. Local test success and the Vercel build status do not establish deployed route behavior or physical-GPU smoothness.

## October 27, 2026 — Whole-model reveal and eye/jaw registration follow-up

Arush asked to restore the earlier whole-model transition as the default, with smoother response similar to adjusting a 3D Slicer threshold. He retained the sectional transition as a backup and reported that the avatar's eyes/jaw sit above the bone/vessel landmarks.

The default now blends complete opaque 3D views in linear light: avatar → bone → vessels → vessels+cortex. Each view has a normal depth buffer. `LayerBlendRenderer.mjs` maintains two reusable render targets; scrubbing an unchanged camera within a layer pair changes only the final blend. Camera/load/resize changes invalidate the views. Tone mapping/color conversion happen once after the blend. The meshes and avatar textures remain real and rotatable. Transition weights use continuous smoothstep windows, with the existing 45 ms damping; elapsed time is no longer capped for reveal smoothing after a delayed frame.

`?reveal=section` keeps the sectional backup, with the selected mode retained through chapter links, refresh, and new tabs. The prior implementation is also preserved on `codex/sectional-reveal-backup` at `f15dbc9`. The comparison query uses the current registration so both reveal styles get the alignment fix.

The new shared `registerAnatomyPoint()` mapping lifts the internal head while gradually extending the neck, fits the generic cranium's width/depth to the stylized head, and settles the crown inside the hair. Shoulder-base fitting is retained. Bone, vessels, cortex and hotspots use the same mapping. Frontal and side overlays show the jaw and eye sockets substantially closer to the avatar's features; this is an illustrative fit, not anatomical reconstruction or a claim of exact scan registration. Original avatar/model GLBs remain unchanged. New evidence is in `qa/global-reveal/`, including front/side before-and-after alignment sheets and intermediate 0/15/25/34/50/68/85/100 views from four angles.

Performance evidence: `timing.json` compares 3.5 seconds of a continuously varying 12–24 reveal after warming the avatar/bone pair at 1366×768 in Chromium/SwiftShader. Browser animation callbacks increased from 1.98/s for the original transparent-mesh reveal to 27.30/s for the full-view compositor. This is a controlled cloud software-renderer comparison, not a physical GPU benchmark; cold layer changes still require rendering a view, and orbiting/zooming invalidates the cache. Physical-phone GPU smoothness and pinch gestures remain unmeasured.

Validation: Node 22 production build passed with the existing chunk-size advisory. Four Sites/packaging checks and nine routing/reveal/compositor/registration checks passed. New coverage verifies whole-stage shortcuts, native comparison links, cache reuse across scrubbing/shared-stage changes, invalidation on camera/size changes, resource disposal, and continuous registration without folds/mirroring. Browser acceptance checks and their report are saved alongside the new evidence. The cloud environment still uses the system-font fallback because Google Fonts access is blocked. Production is unchanged; delivery remains the existing PR/branch preview.

Final aligned-source browser run: all eleven acceptance groups passed with no unexpected errors, including direct chapter loads/history, four viewport sizes, exact camera/avatar restoration, slow/fast/reversed full-model scrubbing, and backup-mode chapter refresh. The sampled motion run recorded 18.53 browser callbacks/s across stage changes and screenshots in SwiftShader. A separate final pointer-drag/wheel-zoom test also passed and preserved the camera image through a reveal round trip. These observations complement the warmed-pair timing comparison; they do not establish performance on a physical phone.

## October 27, 2026 — Selected sectional production release

Arush requested the sectional transition with corrected eye/jaw alignment and authorized main/Vercel publication. Sectional mode is now the default for home and direct chapter URLs. `?reveal=section` remains supported; the whole-model alternative uses `?reveal=blend` and retains its mode in chapter links/new tabs/refresh. The shared registration and original model assets are unchanged from the verified aligned implementation.

Release checks: Node 22 production build, four packaging/worker checks and ten regression checks passed. The full Chromium acceptance suite passed all eleven groups with no unexpected errors: direct routes/history/new tabs, modified links, keyboard focus, dialogs, four viewport sizes, asset responses, exact camera/avatar restoration, slow/fast/reversed sectional scrubbing, and the retained whole-model alternative. `qa/release-section/` records the report, default transition sequence and desktop/mobile chapter views. The software-rendered motion sample recorded 5.98 browser callbacks/s; physical GPU/phone performance remains unmeasured. Vercel production status is verified separately after the authorized merge.

## October 27, 2026 — Seven-section portfolio and item browsing

The requested sections are now About Me, Education, Experience, Projects, Awards, Courses and Publications. `src/content/portfolio.mjs` is the shared source for labels, content, section camera/layer presets and hotspot locations. The updated supplied résumé seeds the copy and replaces the served PDF; SymptomAI retains concise information from the previously supplied résumé. Courses has an honest empty state pending more information. Contact now uses the updated résumé's email.

All seven hotspots appear after model loading, including on the outer avatar before opening a section. Labels are distributed on stable left/right rails and use leader lines to separate 3D anchors. Section selections use distinct face/cortex/vascular/frontal/crown/spine/posterior views. Camera movement follows a spherical path around the model, respects reduced motion, and yields to manual orbit/zoom. Selecting the current section again restores its preset without adding history.

Controls now have visible Pause/Rotate, Reset, Zoom out and Zoom in labels, >=44 px targets and a position above the layer panel. Layer stops are 15 px text with >=44 px targets. Reset and keyboard Home restore both slider 0 and the initial whole-person camera, without closing section text. The shared eye/jaw registration and default sectional transition are preserved.

`SectionReader` provides a compact side index on desktop and horizontal index on mobile, a bounded native-scroll content window, a reading counter, and previous/next controls. Selecting an item scrolls only the reader, keeping the page and camera still. Item hashes can be copied. Off-screen content uses CSS content visibility; reader state is isolated/memoized from the scene, and stationary hotspot positions avoid repeated layout writes. Mobile provides View 3D / Back to reading links. Native canvas `pan-y` is explicitly preserved against OrbitControls' inline touch style.

Verification: Node 22 production build, four worker/packaging checks and twelve regression checks passed. The full browser suite passed nine acceptance groups with no unexpected console/page errors. It covered seven visible non-overlapping hotspots, all section views, readable/touch-sized controls, item index/previous/next/wheel navigation without camera/page movement, full reset by button and keyboard, direct item links and refresh, browser history/new tabs, legacy route migration, dialogs/contact, 1536/1366/390/320 layouts, mobile 3D jumps and vertical scrolling, the blend alternative, static assets and unknown routes. A data-only fourth-project fixture automatically produced its index and reader entry without component changes. A separate full-motion test passed camera interruption, section reselect, pointer orbit, wheel zoom and reset.

Evidence: `qa/portfolio/` contains the report, prior problem screens, seven section views, scrolled projects and mobile reading/model views. `CONTENT.md` gives a copy/paste item schema and GitHub editing instructions. The previous research/personal URLs resolve to Projects/About Me; production Vercel redirects match the local alias behavior. The existing bundle advisory and cloud system-font fallback remain. Physical-phone GPU/pinch performance and deployed route verification are not established by these local checks.

## October 27, 2026 — Clean introduction and compact atlas labels

The home screen now has no hotspot dots or labels, including after manually moving its layer slider. “Explore the atlas” enters the overview and reveals all seven hotspots. Direct section links also enter exploration; returning home hides the hotspots again. Introductory copy now matches that behavior.

The wide numbered label rails have been replaced with compact pills positioned beside projected dots, with short connectors only where needed. Labels keep 44px interaction targets while their visible pills are smaller. Placement separates nearby labels vertically and keeps them inside the viewer. The camera matrix is updated before projection, so anchors match the current pose after an instant section snap. Section/atlas layouts allocate more width to the text and reader (about 140 extra pixels at a 1366px viewport). Mobile retains its stacked layout and labeled controls.

The production build, four packaging/worker checks and twelve regression checks passed. The browser suite passed all nine acceptance groups with no unexpected errors, including hidden home/manual-reveal hotspots, CTA entry, compact non-overlapping labels across seven camera views, returning-home cleanup, item scrolling, reset, direct routes/history/new tabs, data-only additions, blend mode, and 1536/1366/390/320 layouts. `qa/compact-atlas/` records the new home, atlas, wider reader and mobile evidence. Previous screenshots in `qa/portfolio/` describe the earlier rail layout. Cloud/software rendering and font-fallback limitations remain.

The separate full-motion scene check also passed after the compact-label change: manual interruption, current-section reselect, pointer orbit, wheel zoom and full reset remain functional.

## October 27, 2026 — Minimal opening, balanced side labels and lighter controls

Arush supplied the earlier portrait/headline screenshot as the opening reference and requested an in-between label layout inside. The opening now removes the eyebrow, portrait caption and extra hint, emphasizes a larger portrait/headline, and keeps hotspots hidden until exploration. Boxed control panels were replaced by a borderless, width-limited strip: gesture hint, layer slider/stops, then text-labeled view controls. Visible words remain; button targets remain 44px. The control area is under 180px tall and capped at 600px wide in the checked desktop layout.

Inside the atlas, small labels sit in two close gutters beside the head rather than across the face or at the edges of the viewer. Connectors preserve the relationship to the original 3D anchors. Collision handling keeps the compact touch targets separated; the wider item reader remains. A neutral hover style distinguishes hover from the red selected section.

Verification: production build, four packaging checks and twelve regression checks passed. The browser suite passed all nine groups with no unexpected errors, including opening minimalism/control sizing, hidden home hotspots, seven distinct section views and non-overlapping labels, item navigation, reset, history, direct links, dialogs, data-only item addition, the blend alternative, and 1536/1366/390/320 layouts. The separate full-motion test passed manual camera interruption, reselect, pointer orbit, wheel zoom and reset. A final opening capture uses the supplied screenshot’s displayed 1836×1343 viewport for visual comparison. `qa/minimal-atlas/` holds the new evidence; earlier screenshots record earlier design iterations. System-font fallback, software-rendered verification and physical-phone limitations remain.
# Entry photos — October 27, 2026

Optional item photos render through `EntryPhotos.jsx`. Projects and Awards include empty `photos` arrays ready for user uploads; no sample photographs are published. All sections can use the same schema. Galleries keep full image frames in a compact area capped at 240px tall, load lazily, and offer captions, full-size links, and Previous/Next/count controls only for multiple images. Keyboard arrows, Home and End move between photos; native horizontal scrolling supports swipe.

Final Node 22 production build, Sites packaging checks, reveal/navigation regression checks and whitespace check passed. The existing bundle-size advisory remains. `tests/browser-photos.cjs` passed against Vite/Chromium with SwiftShader: temporary files served from `public/photos` loaded successfully; a data-only two-photo project and single-photo award rendered; empty arrays added no gallery; alt text, captions, lazy loading, full-size links, keyboard and Previous/Next worked. Photo navigation preserved page/reader scroll, reveal and canvas pixels. The 320px layout had no horizontal page overflow and retained 44px controls. Award item navigation still worked. No page errors occurred.

Evidence in `qa/photo-gallery/` uses explicitly labeled landscape/portrait QA blocks, not portfolio photos. The browser test removes its temporary public files. Physical-phone touch/GPU behavior remains unmeasured. `CONTENT.md` documents uploading actual photos and adding their paths through GitHub. Publishing this branch creates a review preview; production release is separate.

## Uploaded project and award images — October 27, 2026

Integrated the five user-supplied images from Archive.zip: Threshold and SymptomAI screenshots under their projects; MedAI and DS + X team photos under their awards; the presentation photo under the existing Hackathon for Public Health Equity award (1st Place Overall, May 2024). Supplied screenshots are lossless WebP; team photos are WebP at quality 88, without resizing or cropping. No ZIP metadata files are served.

Synced main through `1500914`, preserving Arush’s edits to personal copy, UCSC education, project ordering/descriptions, courses and awards. Attached the presentation to his existing Public Health Equity award and gave its previously blank ID the stable value `public-health-equity`. There is no duplicate award or project. A data comparison verified all original main content matches after removing optional photos and normalizing that ID. Updated acceptance checks to respect user-edited project order.

Final Node 22 build, Sites checks and twelve regressions passed. The full browser acceptance suite passed all nine groups with no unexpected errors, including native item browsing, routes/history, data-only additions, responsive layouts and retained 3D behavior. Actual-image and gallery verification is recorded with the uploaded-image evidence. Production release remains separate from this review preview.

## Fitted photo frames — October 27, 2026

Removed the shared 16:10 frame and 240px height cap after Arush reported that images looked small with filler. Each image now fills the available reader width at its original aspect ratio, without cropping or padded side bars. Added original width/height metadata to all five photos so their natural space is reserved before lazy loading. Taller images use the existing native reader scroll; full-size links remain available. Future uploads may omit dimensions, but adding them avoids load-time layout shifts.

Final Node 22 build, Sites packaging checks, twelve regressions and whitespace checks passed. Actual-file verification checked all five image assignments, natural aspect ratios and exact frame/image bounds (only the 1px border remains), full-size links and desktop/mobile layout; no page errors occurred. Gallery acceptance also passed, including fitted landscape/portrait fixtures, keyboard and button navigation, preserved reader/canvas state, empty/single-image cases and 320px sizing. Visual evidence is in `qa/fitted-photos/`. Earlier fixed-frame screenshots are historical.

## Global synthetic-density reveal preview — October 27, 2026

Implemented Arush’s `DENSITY-BRIEF.md` on `codex/density-reveal`, preview only. The no-query preview replaces the moving sectional cut with a continuous global density transfer: natural avatar, glass/erosion, ivory bone, bone-and-vessel CTA, vessel dominance, and cortex with major vessels. Prior section/blend modes remain explicit comparisons. The four source GLBs, registration, lighting rig and section presets are retained. A pending-view cancellation race found by the motion test was corrected so immediate manual input wins over a not-yet-started section camera move. Main content through `3f03bfe`, including Arush’s UROP poster photo, is preserved.

`DensityReveal.mjs` uses a common stable spatial field and thickness-weighted thresholds. Separate bone/artery sidecars are generated by a deterministic BVH/ray thickness bake; source model bytes are unchanged. `DensityRenderer.mjs` caches shaded surface/depth/density/thickness attributes from one 3D scene, then masks and depth-sorts pixels for each reveal value. These are not finished scene crossfades. Pure density scrubbing reuses geometry captures. The original full-resolution opaque avatar is used through 15; density composition uses a 70% intermediate with a bounded edge filter. Shader prewarming has a synchronous compatibility path. The fallback without floating-point color buffers was exercised.

Validation passed: production build, four Sites/packaging checks, sixteen routing/reveal/density regressions, the nine-group site browser suite and focused full-motion camera/orbit/zoom/reset test. The density browser suite passed all seven acceptance groups with no unexpected warnings/errors. It checked 0, 15, 20, 26, 34, 56, 60, 68, 76, 85 and 100; forward/reverse images matched; position-buffer hashes, transforms, camera and lights were unchanged by scrubbing. Repeated forced renders were stable. Pixel changes around 15/34/68/74/100 stayed below 1 mean RGB level on the 0–255 scale. Upper/middle/lower thirds changed together during the surface reveal. 390px and 320px controls/layouts and the RGBA8 fallback passed.

The indicative SwiftShader comparison reported mean frame intervals of 103.8 ms desktop (1366×900) and 51.5 ms mobile-sized (390×844), versus 381.5 and 348.5 ms for the retained sectional effect. That is about 3.7× and 6.8× higher software throughput, with no surface recaptures during the measured density sweep and no camera drift. These software rates remain below typical hardware-GPU targets; they do **not** establish physical desktop/phone frame rates. Assess the preview on the user’s hardware before a production decision. `qa/density-reveal/performance.json` holds the measurements rather than an inferred 60-fps claim.

Remaining limits: no actual CT/HU or volumetric scattering; geometric caliber estimates include smoothed fallbacks; two bone/arterial depth peels plus a separate trunk capture cannot reconstruct arbitrary deeply occluded interior surfaces; the bounded density intermediate softens fine details. See `DENSITY-REVEAL.md`. No new organs or tissue-view prototype were added. Production release requires Arush’s approval of this concrete preview.

## Density preview resolution refinement — October 28, 2026

Arush approved the transition’s behavior and requested sharper rendering. The 70%-size intermediate and aggressive edge filtering were softening the cortex and vessel edges. The transfer function, landmarks, phase timing, geometry, registration and lighting are unchanged.

Still views now compose at the entire backing-buffer resolution, with DPR up to 2 and bounded supersampling (1.4M desktop / 650K mobile pixels; minimum native CSS resolution). Active input uses a CSS-resolution intermediate and a final sharp frame is scheduled after motion settles. Its edge filter uses 25% strength at rest versus 70% during motion. A target-error-based quality condition prevents repeated downshifts during the final damping tail. Refinement reuses the same surface caches and does not move the model or camera.

The same 510×570 CSS viewer at emulated DPR 2 improved from a 536×599 composition / 765×855 backing buffer to a 1020×1140 composition and matching backing buffer: about 3.6× as many composition pixels. Side-by-side captures in `qa/density-resolution/` were visually inspected; cortex folds and vessel edges are clearer without changing the transition. The frame-count/performance data under `qa/density-reveal/` describes the earlier lower-resolution preview, not this refinement.

Validation: production build, four Sites/packaging checks and seventeen regression checks passed. All eight density browser acceptance groups passed without unexpected warnings/errors, including reversible images, unchanged transforms/camera/lighting, stop continuity, forced-frame stability, mobile layout, RGBA8 fallback and a new DPR-2 native-refinement check. A full-motion run confirmed that damped scrubbing switches to native detail and stays there without quality oscillation. The existing camera-interruption/orbit/zoom/reset browser test passed. Source geometry is not recaptured to refine resolution. Physical-device GPU performance and memory limits remain separate from emulated viewport/DPR checks. Production is unchanged; continue reviewing PR #4.

Arush supplied the earlier Publications view as the sharpness target. A further same-camera, same-size comparison at 510×570 CSS pixels confirms the retained sectional renderer uses an 841×940 backing buffer (DPR 1.65) while the refined density view uses 1020×1140 (DPR 2). `qa/density-resolution/reference-comparison.png` records both at CSS size. The different surviving vascular branches follow the already approved density transfer; this follow-up changes sampling/filtering only.

## October 28 — atlas, Education and vessel presets

Story: navigation or a layer button selects a content preset, which drives the shared slider state and the registered Three.js camera/reveal. There is no API or credential boundary for this change.

- Vessels and Experience now select 72%, where the bone has receded. The layer indicator boundaries and accessible description follow the updated stop.
- Explore the atlas starts at 50%. Initial state uses `overviewView.reveal`, so a direct load does not start at the old 100% value.
- Education selects 50% and a sagittal side camera at `[-6.2,1,0]`, targeting `[0,1,0]`. Its caption describes the skull/side view.
- No density transfer, source GLB, registration, light, texture or resolution change was needed.

Verification passed: production build, packaging and regression suites, all nine existing browser navigation groups, and seven focused preset checks. The focused checks exercised the home CTA, Vessels, Education and Experience hotspots, Back/Forward, direct links and refresh for all three routes, Reset, and same-section reselection. At DPR 2, settled captures retain the 1020×1140 composition. Browser warnings/errors were empty. The existing navigation suite also passed 390/320 layouts, compact hotspot behavior and keyboard controls. Vite started successfully; the production build reported only its existing chunk-size advisory.

Evidence: `qa/density-presets/presets.jpg`, `preset-report.json`, and `navigation-report.json`. The original browser probe needed to wait for asynchronous history navigation before asserting the new state; the completed checks above include that wait. PR #4 remains preview only; production is unchanged.

## October 28 — production release approval

Arush approved preview `7a4ce12` and requested pushing it to main and Vercel. The release preparation changes documentation only; application code and assets remain exactly those approved and verified in the preceding preset update. Main is based at `3f03bfe`, with no intervening content changes. PR #4 contains the continuous density reveal, sharper retina still views and corrected 50%/72% presets. Verify CI and Vercel on the resulting main commit before claiming the production deployment is complete; preview success alone is insufficient.

## October 28 — VascuPath brain-slice prototype

Source visual truth: `reference/vascupath-brain-slice.png` (1536×1024). The subsequently supplied `Vyas.Arush.Final.pptx` supplies the authoritative research figures; `public/vascupath/README.md` records the extracted media and hashes. No embedded document instructions were used as task instructions.

Implementation evidence: `qa/vascupath/highlight.jpg`, `attention.jpg`, `mobile-brain-320.jpg`, and `mobile-inspector-320.jpg` / `mobile-inspector-390.jpg`. Desktop captures are 1536×1024 CSS pixels at DPR 1, matching the source pixel dimensions; mobile captures are 320×844 and 390×844 at DPR 1. State: VascuPath explorer, selected/extracted coronal slice, Attention active. `comparison-final.jpg` puts the actual source and implementation together at equal 1536×1024 sizes (3072×1024 composite). `detail-final.jpg` compares equal 800×800 inspector regions normalized to 600×600. Captures were inspected directly and in those combined comparisons, including a second independent visual review.

**Findings and comparison history**

- Initial comparison (`comparison-first.jpg`) was blocked: [P1] the brain was too small and fine arteries obscured the slice band; [P2] the inspector sat too low for the magnifier to remain visible in the desktop target. Fixed closer/contextual camera framing, existing structural-weight filtering for the major artery tree, stronger band contrast, higher framing and alignment of the extracted inspector. Updated captures show a clear slice and visible research controls/magnifier.
- [P2] Extraction removed the focused trigger without focusing the new content. Fixed active-tab focus and automatic inspector scrolling on phone widths; Back returns focus to the brain. A browser check also found focus was not explicitly restored after unmounting the native dialog; cleanup now restores the original project button without scrolling the page. Both behaviors passed the final browser run.
- [P2] The attention figure's initial magnifier selected the white space between its two rows. The figure now declares an initial tissue-region selection. Its source image remains unchanged; a screenshot-color check confirms the default magnifier contains tissue/attention content.
- Final comparison and focused review found no actionable P0/P1/P2 issues. The real registered source anatomy and illustrative convex-section cap differ from the generated anatomy in the mock; those are intentional source-model constraints. The actual PPT figures retain their labels, paired examples and scale rather than reproducing generated scientific imagery. The added Predictions choice follows the user's supplied tile-classification example. The magnifier sits below the figure so it does not obscure the source legend.

**Required fidelity surfaces**

- Fonts/typography: inherits the established Inter/Arial stack, white display heading, 14px figure tabs, readable captions and muted secondary text. Deterministic cloud captures block external fonts and use Arial fallback; the live Inter download was not measured. Minor fallback-glyph differences are expected.
- Spacing/layout: two-column desktop composition, compact top navigation, a sticky Back/Close row, fitted brain/cap framing and stacked mobile content. No horizontal overflow at 390/320px. Image controls and return actions remain reachable; selecting the slice brings the mobile inspector into view.
- Colors/tokens: existing pure black surface, white text, gray supporting text and red action state. Prediction blue/pink/red and attention colors come from the supplied figures; the source percentile scale is preserved.
- Image quality/assets: the three served figures were compared byte-for-byte with their PPT media and match exactly. Native aspect ratios are preserved; Attention is capped at its original 612×432 CSS size. The brain/cap are interactive real source geometry, with the cap and anatomical position explicitly illustrative. No new research predictions or spatial registration are implied.
- Copy/content: distinguishes Original, tile Predictions and Attention. Research captions describe the supplied outputs; no new clinical measurements, diagnoses or performance claims were added.

**Verification**

Production build, packaging suites, existing regressions and two new geometry invariants passed. All six VascuPath browser groups passed: keyboard/pointer slice selection and extraction; synchronized Original/Predictions pan/zoom; independent complete Attention figure; linked region magnification; Reset/full-figure links; Back/Close/Escape focus behavior; unchanged underlying atlas pose/layer; route exit; 390/320 layouts. All nine existing atlas browser groups also passed. Logs contained no unexpected browser warnings/errors. `interaction-report.json` and `atlas-report.json` record these checks. `motion-fallback.json` records intermediate extraction frames, animated return, and successful access to research figures with WebGL disabled; the fallback's expected renderer-unavailable condition produced no page errors. Source GLBs, density renderer, registration and existing presets are unchanged.

**Open questions / follow-up polish**

- P3: a higher-resolution attention figure would improve extreme zoom. The current source-resolution cap, pan/zoom and full-figure link expose the supplied figure faithfully.
- Physical-phone GPU performance and pinch behavior remain unmeasured by cloud SwiftShader. Word-labeled zoom/selection controls provide gesture alternatives. The cap is an illustrative interior, not a reconstructed volume.

**Implementation checklist:** selected reference captured; original media extracted and verified; core interactions exercised in the browser; initial P1/P2 findings fixed and recaptured; preview kept separate from production.

**final result: passed**

## October 28 — right-side brain focus and left-side research figures

Arush requested keeping the interactive model on the right, placing figures on the left, focusing on the brain rather than the vessel tree, extracting the tissue toward the left, and smoothly reversing to the original Projects view. This explicit update supersedes the earlier mock’s column arrangement.

`qa/vascupath-left/` records the new desktop, short-laptop and phone captures. Desktop highlight and Predictions/Attention captures were inspected directly, with an independent review. The camera flies from the stopped atlas pose/rectangle into a bounds-fitted cortex view while arteries fade away. The selected slab moves screen-left toward the figures. Close retracts it, restores the exact captured camera/target and vascular context, then dissolves back into the original atlas. The canvas flight uses its actual animated dimensions to preserve projection; the current atlas rectangle supplies the return destination after a resize. Word-labeled controls remain compact and reachable.

The predictions source was re-audited: PPTX slides 1 and 3 reference the same 1400×870 JPEG, and there is no sharper duplicate or vector/embedded original. Its bytes remain unchanged. Image/magnifier placement and width are aligned to the device-pixel grid, with normal photographic interpolation, native proportions and a full-source link. No invented detail or artificial upscaling was added. Attention remains limited to 612×432.

Verification passed: production build, packaging and regression suites; two additional invariants for projected framing and monotonic exact-ended flight timing; all nine existing atlas browser groups; six reduced-motion explorer groups plus three full-motion/resize/fallback groups. `interaction-report.json` records the reduced-motion results and `motion-report.json` records animated entry/return, viewport resize and unavailable-WebGL results. The animation test observes intermediate progress and vessel opacity and confirms both the private return camera and the underlying atlas exactly match a custom orbit/zoom snapshot with the slider at 72%. No unexpected browser warnings/errors were recorded in normal contexts. A separate loading-state check confirms native initial focus lands on visible Back, Tab reaches visible Close, and Escape closes even while the cortex request is held.

Review found one P2: opacity-hidden chrome initially remained keyboard focusable. The header, figure and model regions now become inert until ready and during return, while visible Back/Close remain available during loading. The follow-up keyboard check passed. Final desktop/phone review found no remaining actionable P0/P1/P2 findings. Physical GPU/phone performance and pinch remain unmeasured; this evidence uses cloud Chromium/SwiftShader. Main/production remain separate from this preview.

**final result: passed**

## October 28 — continuous shared-canvas zoom correction

Arush reported visible jitter and a screen switch in the prior entry/exit. The cause was architectural: a second renderer loaded duplicate models while CSS animated its viewport dimensions, causing repeated projection/DPR/render-target changes and a visible material handoff. The old `BrainSliceScene.jsx` and its unused shader helpers are removed.

The explorer now keeps the original atlas canvas, renderer, camera, source models and density compositor. It temporarily reparents only the existing imperatively owned canvas into the transparent native dialog, retaining its desktop rectangle and backing-buffer dimensions. The original host remains sized. Camera motion and vessel fading occur in the same compositor, using optional focus uniforms separate from the approved Look within transfer. The optional extracted slab has its own depth/color capture in that compositor. Offscreen preparation warms the new shader variants before entry; full focus skips vessel captures. Returning restores the source camera/target/quaternion and existing atlas resources. Caption/figure entrances use a clipped aperture from the brain side, a narrow red sweep and staggered text. The preference for reduced motion removes those effects.

Evidence: `qa/vascupath-continuous/` includes current desktop and 390/320px phone captures, nine-group explorer acceptance and nine-group atlas reports. A frame-by-frame browser observer confirmed the same renderer/camera/brain identities, one fixed desktop draw-buffer size and one fixed canvas screen rectangle through animated entry and exit. Tests exercise a custom orbit/zoom and 72% layer, exact private/main camera restoration, extraction toward screen-left, native pan/zoom/region state, resize return and unavailable-WebGL access to figures. Browser tests recorded no unexpected warnings/errors. Unit checks separately verify early continuous context fading, late context return, exact control/pose restoration, preparation cancellation and comparison fallback restoration; offscreen warm-up never overwrites the default framebuffer, and optional targets/materials are removed afterward. Build, packaging and regression suites passed.

Desktop/mobile screenshots were directly inspected and independently reviewed. An initial capture revealed the underlying footer blurred through the dialog: the global backdrop blur is now explicitly disabled and underlying footer chrome fades with the reader. The red sweep pseudo-element is also explicitly disabled for reduced motion. Short-laptop capture and blend-mode research access passed in a fresh browser. No remaining actionable P0/P1/P2 issue was identified. The retained blend/section comparisons offer figure access while preserving their normal atlas; their 3D slice focus is density-specific. Physical device FPS/smoothness and pinch remain unmeasured by cloud SwiftShader. The cap/location remain illustrative, and exact source research image bytes are unchanged.

Main/production remain separate from this review preview.

**final result: passed**


## October 28 — first-visit Explore brain slice button

The entry button’s existing base/hover styles were inside the lazy explorer stylesheet, so the first visit rendered an unstyled text button; returning from the explorer left that stylesheet loaded. Moved those exact rules into the main stylesheet. No reader markup, copy, spacing values or transition code changed. Fresh production-build browser contexts at 1536px and 390px verified the explorer CSS was not loaded initially and the button was already a red 44px pill with a 24px radius; after opening/closing the explorer its computed styling was identical. No page errors occurred. `qa/vascupath-entry/` contains captures/report. Production build and packaging checks passed.

**final result: passed**


## October 28 — VascuPath release authorization

Arush approved the first-visit button fix and the continuous brain-slice explorer at preview `8348154`, then explicitly requested pushing to main and Vercel. PR #5 releases this reviewed implementation. Release-preparation edits update documentation only; the approved application source/assets are unchanged. The preview’s GitHub Actions run `40789020303` and Vercel deployment succeeded. Check the resulting main commit’s Vercel status separately before claiming production deployment complete.


## October 28 — centered opening composition

Arush requested moving the large headline and avatar closer to the center. The desktop home hero is now auto-centered at `min(88%,1280px)` with no extra copy inset; the subtitle can wrap at narrower widths. The canvas remains real, interactive 3D with the existing camera, framing logic and controls. Exploration layouts and the mobile stack retain their existing CSS.

Production-build browser captures were inspected at 1697×1058, 1536×1024, 1366×768, 1024×768, 390×844 and 320×800. The desktop hero is horizontally centered, columns do not overlap, the opening action fits the viewport, and no size has horizontal overflow. Projects still loads its seven hotspots. No page errors were recorded. Build and packaging checks passed. `qa/home-centered/` contains before/after, laptop/mobile captures and bounding-box results. Cloud captures use the Arial fallback while external font requests are blocked. No actionable P0/P1/P2 findings remain for this scoped layout update.

**final result: passed**
