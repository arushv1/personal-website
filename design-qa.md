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
