# Editing the portfolio

All seven sections and their entries live in **`src/content/portfolio.mjs`**. Edit this file in GitHub, commit your change, and open the resulting preview. Components, item counts, item navigation, section links, and hotspots are generated from that data.

## Add a project

Find the object with `id: 'projects'`. Add an object to its `items` array, copying this shape:

```js
{
  id: 'my-project',                  // Unique, stable, lowercase, hyphenated.
  title: 'My project',
  subtitle: 'A short description',   // Optional.
  period: '2026',                   // Optional; use an approved date.
  summary: 'What it does and why it matters.',
  tags: ['Python', 'Medical imaging'],
  body: ['A paragraph about the work.'],
  highlights: ['A concrete contribution or verified result.'],
  links: [{ label: 'View project', href: 'https://example.com' }],
},
```

Only `id`, `title`, and `summary` are required. `subtitle`, `period`, `tags`, `body`, `highlights`, `facts`, `links`, and `navTitle` are optional. `navTitle` provides a shorter label in the item index when a title is long. Omit fields you do not need; do not publish placeholder links or unsupported results. Text is rendered as plain text, without HTML.

The order in the array is the reading order. A new entry automatically appears in the side index (horizontal on mobile), reader, item count and previous/next controls. No React edits are necessary. The reader uses native scrolling and renders off-screen entries efficiently, without rerunning the 3D scene. An item can be linked directly, e.g. `/projects#threshold`.

The same structure works for **Education**, **Experience**, **Awards**, **Courses**, **Publications**, and **About Me**. Add courses to the currently empty `courses.items` array to replace its empty state. Do not change existing item IDs casually: their direct links use those IDs.

## Section locations and camera views

Every section has an `anchor`, a preferred `callout` side, and a `view` with camera `position`, `target`, and `reveal` (0–100). These define the hotspot, its label’s preferred side of the head and the camera/layer preset when opened. The positions are a storytelling index, not a claim about where activities occur in the brain. The shared anatomy registration is applied automatically to the anchors.

Adding items does **not** require changing these values. When adding an entirely new section, add its complete definition and update the known-route pattern in `vercel.json`; existing sections and their routes are derived automatically. Labels are placed automatically in compact gutters beside the head, with connectors to their projected anchors and vertical spacing to avoid overlap. The seven approved sections should remain recognizable.

## Résumé and sources

The served résumé is `public/arush-vyas-resume.pdf`, updated from the résumé supplied for this task. Project/experience/publication/award copy is a concise adaptation of the supplied résumés, with personal context from the existing site. SymptomAI uses the previous supplied résumé because it is not in the newer one. Course names have not been supplied; none are invented. Add richer case-study text as it becomes available.

## Check your change

```bash
npm run build
npm run test:sites
npm run test:regression
```

Start `npm run dev` and check your entry using its index link and scroll. The optional `tests/browser-smoke.cjs` acceptance suite also verifies a data-only fourth-project addition in the running development app without changing components.

The optional `tests/browser-scene.cjs` test checks full-motion camera interruption, pointer orbit, wheel zoom and reset. Both browser scripts require Playwright and Chromium in the test environment; `CHROMIUM_PATH` can select the browser binary.
