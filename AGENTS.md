# Agent context: Arush's personal website

Read this file before changing the repository. It is the handoff for the current design, implementation, decisions, and verification. Keep it updated when Arush makes durable decisions or the architecture changes. Use repository-relative paths so the context works on another machine.

## Goal and current authorization

Build a distinctive, immersive personal website for Arush Vyas. The experience should describe the person behind the resume through interactive exploration, with medical imaging as its visual language.

Canonical repository: https://github.com/arushv1/personal-website, default branch `main`. Arush explicitly asked to put this prototype in that existing repository and authorized replacing its previous contents. Preserve normal Git history; do not force-push. The prior Next.js implementation is available at commit `7d7557c`.

The current task is repository preparation and customization support. Uploading source to this repository is authorized. Publishing a website, changing hosting accounts, or changing repository visibility needs a corresponding user request. The repository was already public; preserve that visibility. Do not assume a GitHub push confirms a live deployment.

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
7. Use generic, coherently registered anatomy for this iteration. No personal scan or custom likeness was supplied. A custom head can be a future asset project; do not imply this is Arush's anatomy.
8. Real sourced anatomy differs in contour and vessel distribution from the generated illustration. Preserve coherent 3D and the chosen composition instead of distorting anatomy to match every image pixel.
9. Chapter markers are a storytelling device. Their locations do not claim that hobbies or personality reside in those anatomical regions.

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
| `public/models/` | Three served GLBs, manifest, attribution, and original notices |
| `public/draco/` | Local Draco decoder and license notices |
| `public/arush-vyas-resume.pdf` | Downloadable resume |
| `source-assets/` | Retained preprocessing inputs and upstream notices |
| `scripts/prepare-anatomy.mjs` | Selects and compresses bones and arteries |
| `scripts/prepare-brain.mjs` | Registers and compresses the directly sourced cortex |
| `vite.config.mjs` | Vite configuration; client output is `dist/client` |
| `vercel.json` | Overrides the previous Next.js hosting preset with Vite, `npm ci`, `npm run build`, and `dist/client` |
| `worker/index.js` | Optional Sites worker entry |
| `scripts/prepare-sites-build.mjs` | Copies worker and hosting metadata into build output |
| `.openai/hosting.json` | Sites-compatible configuration, currently no project ID |
| `tests/sites-worker.test.mjs` | Four worker and packaging contract tests |
| `.github/workflows/ci.yml` | Installs, tests, and builds on pushes/PRs; no deployment |
| `reference/selected-option.png` | Selected design target |
| `design-qa.md`, `qa/` | Completed QA report and visual evidence |

The app needs no API keys, patient data, account integration, database, or application backend. Fonts load from Google Fonts, with a system fallback. Models and decoder are served locally.

## Interaction model

`App.jsx` owns `reveal`, `exploring`, `chapter`, `spinning`, `ready`, and `dialog`. It calls the scene through a ref exposing `reset()` and `zoom(direction)`.

- Home: three-line “Take a closer look.” headline, red “Explore within” action, generic head/neck, reveal initially 28.
- Rotation begins gently unless reduced motion is requested. Pointer or keyboard manipulation pauses automatic rotation.
- Explore within: reveal rises to 86, rotation pauses, camera moves inward, and five chapter choices appear.
- Chapters: `research`, `roots`, `making`, `setup`, `stories`. `about` is also available from the header.
- Chapter selection raises reveal to 89, opens readable content, and focuses its heading. Chapter navigation remains available alongside the 3D scene.
- Returning home resets the camera and reveal, and returns focus to the primary action. Escape returns from atlas exploration when no dialog is open.
- Contact and Model credits use native dialogs. Email is a `mailto:` link; nothing sends automatically.
- Pointer drag orbits, wheel/pinch zooms, arrow-left/right rotate, plus/minus zoom, and Home resets the focused canvas. Buttons provide pause/play, reset, and zoom alternatives.
- On mobile, `touch-action: pan-y` preserves vertical page scrolling while sideways drag rotates the model. Keep this behavior and the mobile-specific gesture hint.
- Range controls, buttons, focus indicators, reduced-motion behavior, loading/retry states, and the unavailable-WebGL path must stay usable.

`AnatomyScene.jsx` uses `GLTFLoader`, `DRACOLoader`, and `OrbitControls`. It projects marker anchors into screen coordinates every frame. Automatic camera easing must be cancelled when manual interaction begins. Dispose of scene resources, observers, and animation frames on unmount.

When adding a chapter, update `chapters` and `order` in `App.jsx`, plus `anchors` and marker labels in `AnatomyScene.jsx`. The IDs must agree. There is no separate content CMS yet.

## Assets and provenance

The browser loads only `bone.glb`, `arteries.glb`, and `brain.glb`. They total approximately 1.5 MB. The current manifest records 136,392 bone triangles, 233,689 artery triangles, and 115,804 cortex triangles. Pixel ratio is capped at 1.65, and rendering is throttled to roughly 50 frames per second to limit cost. Avoid adding large full-body geometry or unbounded device pixel ratios without measuring the effect.

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
```

Start and inspect the local preview yourself when tools permit. Keep `node_modules/`, `dist/`, caches, environment files, and credentials out of Git. Commit the lockfile when dependencies change. Never copy unrelated files from neighboring personal/recruitment directories into this repository.

For a change, run appropriate checks and inspect the affected interactions. Before handoff involving packaging/runtime or a deployment, run `npm run build` and then `npm run test:sites`, sequentially. The packaging test reads generated build output and will fail on a fresh clone if run before the build. Expected output: `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`. Keep the worker, packaging helper, tests, and hosting configuration functional unless an explicitly requested migration replaces them. The frontend can also be hosted statically from `dist/client`.

For visual or scene changes, check home, reveal endpoints, orbit, zoom, reset, atlas entry, chapter selection/back, Contact, Model credits, and console logs. Check desktop and narrow mobile, plus short laptop height. Existing evidence covers 1536x1024, 1366x768, 390x844, and 320x800. Verify that the page scrolls on mobile and controls remain accessible. Update `design-qa.md` with new evidence when behavior or appearance changes materially; do not mark an untested change passed.

Existing QA passed for the selected prototype: actual orbit/wheel zoom, layer reveal, hotspots, chapter navigation, dialogs, keyboard alternatives, responsive fit, build, and the four Sites tests. No actionable P0/P1/P2 findings remained. These are historical results, not a substitute for checking a later change.

## Limits and remaining work

- Generic anatomy, not Arush's face or medical scan.
- Draft copy; detailed case studies, personal photographs, exact setup specifications, and richer personal stories have not been supplied.
- Real anatomical contours differ from the generated illustration; a custom art-directed model is possible later.
- Physical phone GPU performance and two-finger gestures were not directly measured. Mobile viewport/layout, computed touch action, and button alternatives were checked.
- Reduced-motion handling is implemented; an OS preference toggle was not directly exercised in the initial QA run.
- The app has no production analytics, form backend, CMS, or custom domain configuration.
- This repository now uses Vite. `vercel.json` explicitly overrides the old Vercel framework/build/output settings. The existing Git integration is connected: the first replacement commit triggered a failed Vercel deployment despite passing GitHub CI. Always check the Vercel status separately before claiming the live website updated. The production branch is `main`; repair of this existing deployment is within Arush's request that the Vercel website update.

## Work record

October 26, 2026: Built the selected anatomy direction locally; sourced, reduced, and attributed models; implemented orbit/zoom/reveal and personal chapters; corrected short-viewport controls, headline spacing, scapular crop fragments, mobile scrolling, and camera/manual-interaction conflicts; completed visual and interaction QA. Arush accepted it as a good start, requested source control, selected the existing `personal-website` repository, authorized replacement, and requested this all-in-one agent context. Repository preparation adds portable setup/customization documentation, ignore rules, Node selection, and CI while keeping the approved website behavior intact.

Vercel follow-up: commit `b6ce647` passed GitHub CI, but its Vercel status reported a failed deployment. The project was previously Next.js, and the replacement initially had no Vercel-specific config. Added explicit, version-controlled Vite settings so the deployment does not inherit the old framework preset or output directory. Verify the subsequent deployment result rather than assuming this config change succeeded. The Vercel plugin was available but not connected when diagnosis began; GitHub's commit status exposed the deployment failure.
