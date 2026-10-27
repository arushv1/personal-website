# Agent context: Arush's personal website

Read this file before changing the repository. It is the handoff for the current design, implementation, decisions, and verification. Keep it updated when Arush makes durable decisions or the architecture changes. Use repository-relative paths so the context works on another machine.

## Goal and current authorization

Build a distinctive, immersive personal website for Arush Vyas. The experience should describe the person behind the resume through interactive exploration, with medical imaging as its visual language.

Canonical repository: https://github.com/arushv1/personal-website, default branch `main`. Arush explicitly asked to put this prototype in that existing repository and authorized replacing its previous contents. Preserve normal Git history; do not force-push. The prior Next.js implementation is available at commit `7d7557c`.

Current work adds Arush's requested real 3D avatar and internal-layer reveal to the existing personal website. Uploading source to this repository and updating the existing Git-connected Vercel website are authorized by the ongoing requests. Preserve the repository's existing public visibility. Changing hosting accounts or visibility needs a corresponding user request. Do not assume a GitHub push confirms a live deployment.

### Latest requested follow-up — October 27, 2026

Arush selected the first cloud task: (1) shareable chapter URLs with direct Research links, refresh support, and natural browser Back/Forward, and (2) polish of the actual 3D avatar/reveal. He reports that the current avatar does not blend convincingly into the bone/vessel layers and that scrubbing from You to Within looks choppy. Treat that feedback as open work despite the earlier implementation QA pass. The detailed task and launch prompt are in `CLOUD-TASK.md`; they are a handoff, not proof that implementation or cloud execution has begun. Account-side cloud environment creation/publication must be completed separately.

Latest steering: Arush likes the sectional transition as a backup, but wants the default to keep the earlier whole-model change, like adjusting a 3D Slicer threshold. He also identified the avatar's eyes/jaw sitting higher than the bone/vessel structure and asked to fix the registration in the same update. Both requests are part of the active PR; retain the sectional backup and the route/history changes.

## User context and content boundaries

Arush studies biomedical engineering at Boston University and works with medical imaging and AI. Supplied professional context includes VascuPath, Tian Lab, and Boston Scientific. Current research copy is intentionally concise and should be checked with Arush before adding specific claims, metrics, publications, or timelines.

Personal interests explicitly supplied by Arush:

- Bay Area roots; currently studying in Boston.
- LEGO and creating things since childhood.
- Desk setups, multiple monitors, setting up computers, and tinkering with configurations.
- Story-driven games, including Ghost of Tsushima, Onimusha, and Assassin's Creed.

The site currently links to `arushv@bu.edu`, https://github.com/arushv1, and https://www.linkedin.com/in/arush-vyas. The supplied resume is `public/arush-vyas-resume.pdf`. Update these only from user-provided information. Do not invent favorite locations, hardware, personal stories, project outcomes, or photographs.

## Design decisions and rationale

1. Arush initially referenced logartis.info and wodniack.dev for immersive portfolio inspiration, rather than requesting a clone.
2. The favored conceptual thread was exploring one person at different scales: biological structures, projects, places, and life experiences.
3. Arush proposed an interactive head/neck CTA or vascular tree: rotate and zoom, fade bone, and enter brain areas containing personal categories.
4. Arush rejected overly detailed, cinematic scan portraits. The supplied reference was a simple educational anatomy animation with ivory bones, red arteries, and a black background.
5. On October 26, 2026, Arush selected revised visual option 1. The portable visual reference is `reference/selected-option.png`. Preserve its large white sans-serif headline, black surface, red action, and restrained educational 3D style.
6. Use actual 3D geometry. A static raster image, CSS rotation, or decorative particles would not provide the orbit/reveal behavior Arush requested.
7. The first iteration used generic, coherently registered anatomy. Arush later supplied a headshot for a stylized outer avatar. The internal anatomy remains generic and illustrative; do not imply it is reconstructed from his photo or scan.
8. Real sourced anatomy differs in contour and vessel distribution from the generated illustration. Preserve coherent 3D and the chosen composition instead of distorting anatomy to match every image pixel.
9. Chapter markers are a storytelling device. Their locations do not claim that hobbies or personality reside in those anatomical regions.
10. Portrait follow-up: Arush supplied a headshot and explicitly rejected a photo cutout, curved photo plane, and 2.5D/parallax interpretation. He wants an actual stylized 3D cartoon avatar resembling him, following `reference/3d-avatar-style.png`. The character must occupy the same rotatable 3D space as the skull, arteries, and brain. Start with the avatar's outer surface and reveal internal layers with the slider. Preserve his curly dark hair, clean-shaven face, smile, earrings, and blue collared shirt; the sample avatar's beard and spiky hair are style-reference details, not Arush's features. Do not reintroduce a raster portrait as the model.
11. A raster avatar concept is only a reference for mesh creation. The final outer avatar needs real geometry, preferably a textured GLB, with its head/neck registered to the existing internal anatomy. Keep the avatar, skull, vessels, and cortex under a shared world transform and camera; use per-layer opacity or clipping for the reveal. Generic internal anatomy remains illustrative, not a reconstruction of Arush's actual vessels or brain. Verify front, three-quarter, side, and back views before claiming a complete 3D integration.

For routine changes, preserve the selected direction and working interactions. A substantial redesign should start with a clear user brief and visual target, using the available Product Design workflow when applicable. Do not silently redesign the site during a content edit.

## Stack and repository map

The current app is React 19 + Vite 6 + Three.js, using JavaScript ES modules. It replaces the old Next.js/TypeScript app. Icons are from `@phosphor-icons/react`. Dependencies and exact resolved versions are recorded in `package.json` and `package-lock.json`.

| Path | Responsibility |
| --- | --- |
| `src/main.jsx` | React entry point |
| `src/App.jsx` | Personal copy, chapter order, navigation, reveal/rotation state, contact and credits dialogs |
| `src/AnatomyScene.jsx` | Renderer, camera, orbit controls, model loading, animation, keyboard controls, and projected chapter markers |
| `src/styles.css` | Typography, colors, layout, responsive breakpoints, focus, and reduced-motion rules |
| `index.html` | HTML entry and browser metadata |
| `public/models/` | Four served GLBs, manifests, attribution, and original notices |
| `public/draco/` | Local Draco decoder and license notices |
| `public/arush-vyas-resume.pdf` | Downloadable resume |
| `source-assets/` | Retained preprocessing inputs and upstream notices |
| `scripts/prepare-anatomy.mjs` | Selects and compresses bones and arteries |
| `scripts/prepare-brain.mjs` | Registers and compresses the directly sourced cortex |
| `scripts/prepare-avatar.mjs` | Optimizes the legitimate textured Meshy GLB, preserving UVs, normals, and PBR maps |
| `source-assets/avatar/meshy-avatar-textured.glb` | Original textured avatar export; retain for reversible optimization |
| `vite.config.mjs` | Vite configuration; client output is `dist/client` |
| `vercel.json` | Overrides the previous Next.js hosting preset with Vite, `npm ci`, `npm run build`, and `dist/client` |
| `worker/index.js` | Optional Sites worker entry |
| `scripts/prepare-sites-build.mjs` | Copies worker and hosting metadata into build output |
| `.openai/hosting.json` | Sites-compatible configuration, currently no project ID |
| `tests/sites-worker.test.mjs` | Four worker and packaging contract tests |
| `.github/workflows/ci.yml` | Installs, tests, and builds on pushes/PRs; no deployment |
| `reference/selected-option.png` | Selected design target |
| `design-qa.md`, `qa/` | Completed QA report and visual evidence |
| `CLOUD-SETUP.md` | Cloud environment setup prompt and task handoff; account-side publication is required |
| `CLOUD-TASK.md` | User-selected first cloud task: chapter URLs/history and a seamless 3D reveal, with acceptance checks |

The app needs no API keys, patient data, account integration, database, or application backend. Fonts load from Google Fonts, with a system fallback. Models and decoder are served locally.

## Interaction model

`App.jsx` owns the URL route, `reveal`, `spinning`, `ready`, and `dialog`. Exploring/chapter state is derived from the route. `navigation.mjs` defines `/`, `/atlas`, `/research`, `/roots`, `/making`, `/setup`, `/stories`, and `/about`. Initial load and `popstate` read the URL; ordinary navigation pushes once; native anchors preserve modified clicks/new tabs. Chapter titles and focus track the route. Unknown Vite/Sites paths show an in-app not-found view; Vercel returns its native 404 for unknown paths. Vercel rewrites only the seven known non-home app routes, preserving asset requests. The optional Sites worker excludes file paths and asset/API prefixes from HTML fallback.

The scene ref exposes `reset()`, `zoom(direction)`, and `stopMotion()`. Manual reveal pauses automatic rotation, cancels camera easing, and drains orbit inertia while preserving the viewing angle. `reveal.mjs` uses exponential damping with a 45 ms time constant and uncapped elapsed time, so delayed frames do not prolong input lag. Camera easing is time-based too.

Default reveal: `layerBlend()` transfers between complete opaque 3D views: avatar, bone, vessels, and vessels+cortex. `LayerBlendRenderer.mjs` renders at most two contributing views to reusable linear-light render targets, then blends and tone-maps once. This avoids transparency/depth threshold switches and alpha-hash grain in the default view. Cached views are reused during scrubbing; camera, loading and resize changes invalidate them. The final vessels/cortex view has normal shared depth occlusion. A small HDR render-target fallback supports devices without floating-point color attachments. Idle scenes skip GPU drawing.

Backup: `?reveal=section` retains the top-to-bottom sectional reveal (narrow alpha-hashed boundaries with consistent depth-writing). Native links preserve the comparison query through navigation and new tabs. `codex/sectional-reveal-backup` at `f15dbc9` preserves the earlier implementation in Git. The backup query uses the current registration, so alignment fixes apply in both modes.

Registration: `registration.mjs` provides the single `registerAnatomyPoint()` mapping used by bone, arteries, cortex and hotspot anchors. It retains the original lower-neck compression and shoulder fitting, lifts the head by up to .42 units using a gradual neck transition, narrows head X by up to 8%, fits depth by up to 18% with a small forward adjustment, and settles the crown by .10 units. These values were checked against front/side eye sockets and jaw overlays. All internal layers use the same mapping; the textured avatar and source GLBs are unchanged. This fits generic illustrative anatomy to a stylized character and is not a personal medical reconstruction.

- Home: three-line “Take a closer look.” headline, red “Explore within” action, personal 3D avatar, reveal initially 0.
- Rotation begins gently unless reduced motion is requested. Pointer or keyboard manipulation pauses automatic rotation.
- Explore within: reveal rises to 100, rotation pauses, camera moves inward, and five chapter choices appear.
- Chapters: `research`, `roots`, `making`, `setup`, `stories`. `about` is also available from the header.
- Chapter selection raises reveal to 100, opens readable content, and focuses its heading. On the stacked mobile layout, the article scrolls into view so a hotspot opened from below does not leave its heading offscreen. Chapter navigation remains available alongside the 3D scene.
- Returning home resets the camera and reveal, and returns focus to the primary action. Escape returns from atlas exploration when no dialog is open.
- Contact and Model credits use native dialogs. Email is a `mailto:` link; nothing sends automatically.
- Pointer drag orbits, wheel/pinch zooms, arrow-left/right rotate, plus/minus zoom, and Home resets the focused canvas. Buttons provide pause/play, reset, and zoom alternatives.
- On mobile, `touch-action: pan-y` preserves vertical page scrolling while sideways drag rotates the model. Keep this behavior and the mobile-specific gesture hint.
- Range controls, buttons, focus indicators, reduced-motion behavior, loading/retry states, and the unavailable-WebGL path must stay usable.
- Layer shortcuts select You (0), Bone (34), Vessels (68), and Within (100). The outer avatar fades away to reveal the registered inner models. Camera orbit remains free at every stage; the slider alone does not reset the viewing angle.

`AnatomyScene.jsx` uses `GLTFLoader`, `DRACOLoader`, and `OrbitControls`. It projects marker anchors into screen coordinates every frame. Automatic camera easing must be cancelled when manual interaction begins. Dispose of scene resources, observers, and animation frames on unmount.

When adding a chapter, update `chapters` and `order` in `App.jsx`, plus `anchors` and marker labels in `AnatomyScene.jsx`. The IDs must agree. There is no separate content CMS yet.

## Assets and provenance

The browser loads `avatar.glb`, `bone.glb`, `arteries.glb`, and `brain.glb`, approximately 2.4 MB total. The anatomy manifest records 136,392 bone triangles, 233,689 artery triangles, and 115,804 cortex triangles. The avatar manifest records 124,180 triangles. Its web GLB is about 867 KB, reduced from a 20 MB source. Pixel ratio is capped at 1.65, and rendering is capped near 60 frames per second and stationary scenes skip GPU drawing to limit cost. Avoid adding large full-body geometry or unbounded device pixel ratios without measuring the effect.

Avatar: actual Meshy 6 Lite image-to-3D output, then textured using the same generated likeness reference, licensed CC BY 4.0. Both generations used free credits; the official UI permitted downloading the textured GLB while the account showed Free. No paid subscription was purchased. Future export eligibility must be checked in the current UI rather than assumed from this result. Preserve Meshy attribution. The renderer retains its original materials and maps; replacing those with generic or projected-color materials degrades the facial features.

`npm run prepare:avatar` simplifies geometry while preserving UVs/normals, resizes/compresses original textures to WebP, registers the bust at scale 1.7 with Y offset .55, and Draco-compresses the result. The scene applies a shared lower-neck registration to internal geometry below Y .15: new Y = .15 + (old Y - .15) × .55. This fits the cartoon bust's shorter neck while leaving the head/cortex unchanged. All four layers remain real geometry in one world/camera; no portrait plane or limited fake orbit is used.

Bones/arteries: Z-Anatomy / BodyParts3D via https://github.com/nqwrc/3d-anatomy/tree/master/public/models. Preprocessing flattens world transforms before selection so structures remain registered, selects head/neck/upper thorax, removes irrelevant fragments, merges, simplifies, and Draco-compresses geometry.

Cortex: directly downloaded Brain for Blender by Anderson Winkler, https://brainder.org/research/brain-for-blender/, CC BY-SA 3.0. The left/right pial OBJ surfaces are merged, reoriented, registered into the skull, smoothed, simplified, and compressed. Do not substitute an uncertain nervous-system export for this directly attributed brain.

Required attribution strings:

- BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan
- Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0

`public/models/ATTRIBUTION.md` describes the selected derivatives and license links. `UPSTREAM-LICENSE.txt` and `NOTICE.txt` preserve original collection notices. The original collection includes other components; those notices should not be read as saying all such components are served here. Model credits exposes the notices to visitors. Preserve attribution, modifications, and applicable model terms whenever assets are changed or redistributed. Model licensing is separate from the interface code.

The repository retains `source-assets/skeletal.glb`, `cardiovascular.glb`, `brainder/lh.pial.obj`, `brainder/rh.pial.obj`, `License.txt`, and `NOTICE`. The unused exploratory `nervous.glb` and duplicate compressed download are excluded. Preprocessing inputs are not requested by the frontend or copied into the production client.

Run `npm run prepare:models` only when changing model preprocessing or sources; ordinary copy/CSS edits do not require it. It runs anatomy preparation before brain preparation because the brain step appends to the manifest created by the anatomy step. Inspect all three outputs and preserve credits after rebuilding.

## Development and verification

Use npm with the committed lockfile. `.nvmrc` and CI select Node 22; use 22.12 or newer. The original local build was verified on Node 25.9.0. CI is intended to verify the portable Node 22 path; check its actual result before claiming it passed.

```bash
npm ci
npm run dev
npm run build
npm run test:sites
npm run preview
npm run prepare:avatar # Only when modifying avatar source or optimization
```

Start and inspect the local preview yourself when tools permit. Keep `node_modules/`, `dist/`, caches, environment files, and credentials out of Git. Commit the lockfile when dependencies change. Never copy unrelated files from neighboring personal/recruitment directories into this repository.

For a change, run appropriate checks and inspect the affected interactions. Before handoff involving packaging/runtime or a deployment, run `npm run build` and then `npm run test:sites`, sequentially. The packaging test reads generated build output and will fail on a fresh clone if run before the build. Expected output: `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`. Keep the worker, packaging helper, tests, and hosting configuration functional unless an explicitly requested migration replaces them. The frontend can also be hosted statically from `dist/client`.

For visual or scene changes, check home, reveal endpoints, orbit, zoom, reset, atlas entry, chapter selection/back, Contact, Model credits, and console logs. Check desktop and narrow mobile, plus short laptop height. Existing evidence covers 1536x1024, 1366x768, 390x844, and 320x800. Verify that the page scrolls on mobile and controls remain accessible. Update `design-qa.md` with new evidence when behavior or appearance changes materially; do not mark an untested change passed.

Existing QA passed for the selected prototype: actual orbit/wheel zoom, layer reveal, hotspots, chapter navigation, dialogs, keyboard alternatives, responsive fit, build, and the four Sites tests. No actionable P0/P1/P2 findings remained. These are historical results, not a substitute for checking a later change.

## Limits and remaining work

- The outer avatar is an approximate artistic likeness, not a face scan. Its internal anatomy remains generic.
- Draft copy; detailed case studies, exact setup specifications, and richer personal stories have not been supplied. A headshot was supplied for the avatar.
- Real anatomical contours differ from the generated illustration; a custom art-directed model is possible later.
- Physical phone GPU performance and two-finger gestures were not directly measured. Mobile viewport/layout, computed touch action, and button alternatives were checked.
- Reduced-motion handling is implemented; an OS preference toggle was not directly exercised in the initial QA run.
- The app has no production analytics, form backend, CMS, or custom domain configuration.
- This repository now uses Vite. `vercel.json` explicitly overrides the old Vercel framework/build/output settings. The existing Git integration is connected: the first replacement commit triggered a failed Vercel deployment despite passing GitHub CI. Always check the Vercel status separately before claiming the live website updated. The production branch is `main`; repair of this existing deployment is within Arush's request that the Vercel website update.

## Work record

October 26, 2026: Built the selected anatomy direction locally; sourced, reduced, and attributed models; implemented orbit/zoom/reveal and personal chapters; corrected short-viewport controls, headline spacing, scapular crop fragments, mobile scrolling, and camera/manual-interaction conflicts; completed visual and interaction QA. Arush accepted it as a good start, requested source control, selected the existing `personal-website` repository, authorized replacement, and requested this all-in-one agent context. Repository preparation adds portable setup/customization documentation, ignore rules, Node selection, and CI while keeping the approved website behavior intact.

Vercel follow-up: commit `b6ce647` passed GitHub CI, but its Vercel status reported a failed deployment. The project was previously Next.js, and the replacement initially had no Vercel-specific config. Added explicit, version-controlled Vite settings so the deployment does not inherit the old framework preset or output directory. Verify the subsequent deployment result rather than assuming this config change succeeded. The Vercel plugin was available but not connected when diagnosis began; GitHub's commit status exposed the deployment failure.

The Vercel fix at `c19fa87` subsequently deployed successfully; the new atlas was verified at https://personal-website-brown-psi-69.vercel.app. GitHub CI also passed. Vercel's plugin was installed, but the first direct API inspection lacked authorization for the project's team; GitHub status and the public production website were sufficient to verify the deployment.

Avatar work: a local photographic depth-plane experiment was rejected before any commit or deployment. Its code/assets were removed from the active project and archived outside the repository. Meshy and Tripo were investigated for actual image-to-3D generation. No matching generator plugin was found in the available directory. Arush chose the recommended Meshy workflow by signing in and asking the agent to continue. The concept artwork was uploaded, and a Meshy 6 Lite mesh and image-guided texture were generated for 10 free credits each. Front, side, and back geometry were inspected. The official UI allowed both untextured and textured GLB exports on the Free account, despite stricter published help text; no payment or subscription was needed. The optimized textured avatar is integrated with the anatomy reveal. Preserve originals and source notices; check current export rights before starting future tasks or assuming free access.

October 27, 2026: Completed joint visual comparisons and browser QA of the real avatar, all four reveal stages, orbit/zoom/reset, keyboard alternatives, atlas navigation, and dialogs. Desktop, short laptop, 390 px, and 320 px layouts were inspected. Fixed mobile hotspot navigation so the newly opened chapter scrolls into view. Clean installation, final production build, all four packaging tests, and whitespace checks passed; browser warning/error logs were empty. The current `design-qa.md` and `qa/avatar-*` evidence cover this update, while `qa/anatomy-design-qa.md` retains the original atlas report. Check GitHub CI and the Vercel commit status after publication; local verification alone does not establish production readiness.

Avatar release `b6b8eaa` was pushed to `main`. GitHub Actions run `40447894676` passed, and the Vercel commit status reported “Deployment has completed.” The public production URL was then reloaded and checked in the browser: textured avatar loaded, controls enabled, pause/reset worked, full reveal showed cortex/vessels, reversing restored the avatar, and warning/error logs were empty. `qa/avatar-production-final.jpg` records the live opening. Future changes must be verified separately; these results apply to that release.

October 27, 2026 cloud implementation: chapter routing and the sectional reveal are implemented on `codex/chapter-routes-reveal`. Build, worker/packaging, route/link, and time-based transition regression checks are recorded in `design-qa.md`. Browser acceptance code is `tests/browser-smoke.cjs`; run with installed Playwright and Chromium plus the local Vite preview. Review new `qa/cloud/` evidence rather than relying on prior passing reports. Production release is separate from this review branch.

October 27, 2026 follow-up: restored whole-model blending as the default and retained sectional mode as a comparison backup. Added shared eye/jaw/head/neck registration for all internal layers and markers. The full-model compositor reuses opaque layer views during scrubbing. The measured warmed avatar/bone scrub improved from about 2 to 27 browser callbacks/second under matching 1366×768 SwiftShader conditions; physical GPU/phone performance remains separately unverified. Current evidence is `qa/global-reveal/`, with verification notes in `design-qa.md`. Continue updating PR #1 and its branch preview; production has not been changed.
