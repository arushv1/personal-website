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

Only `id`, `title`, and `summary` are required. `subtitle`, `period`, `tags`, `body`, `highlights`, `facts`, `links`, `photos`, `navTitle`, `writeup`, `terms` and `poster` are optional (the last three are described under [Richer entries](#richer-entries)). `navTitle` provides a shorter label in the item index when a title is long. Omit fields you do not need; do not publish placeholder links or unsupported results. Text is rendered as plain text, without HTML.

The order in the array is the reading order. A new entry automatically appears in the side index (horizontal on mobile), reader, item count and previous/next controls. No React edits are necessary. The reader uses native scrolling and does not rerun the 3D scene. An item can be linked directly, e.g. `/projects#threshold`.

The same structure works for **Education**, **Experience**, **Awards**, **Courses**, **Publications**, and **About Me**. Add courses to the `courses.items` array, using the subtitle for the course code and the summary for the associated university. Do not change existing item IDs casually: their direct links use those IDs.

## Add photos to a project or award

1. In GitHub, open `public/photos`, choose **Add file → Upload files**, and upload your images into a folder for the entry, for example `public/photos/projects/threshold/` or `public/photos/awards/urop-poster/`. Use lowercase filenames with hyphens. You can create folders from GitHub's file editor or upload an existing folder.
2. In `src/content/portfolio.mjs`, find that project's or award's `photos: []`. Replace the empty array with your photos, in display order:

```js
photos: [
  {
    src: '/photos/projects/threshold/demo.webp',
    width: 1411,                     // Original image dimensions, recommended.
    height: 984,
    alt: 'Threshold showing trial eligibility criteria alongside a community map.',
    caption: 'Exploring trial eligibility.', // Optional.
  },
  {
    src: '/photos/projects/threshold/team.jpg',
    alt: 'Our team presenting the project at the hackathon.',
  },
],
```

3. Commit the upload and content change to the same branch, then check its Vercel preview. The URL starts with `/photos/`, **without `public`**. Paths and filename capitalization must match exactly. The filenames above are examples; upload your own files before referencing them.

Each photo needs a `src` and descriptive `alt` text; `caption` is optional. Include its original pixel `width` and `height` to reserve the correct space before it loads. One photo appears on its own. Multiple photos create a compact, swipeable gallery with Previous/Next controls and a count. Each photo fills the reader width at its natural proportions, without empty side bars or cropping. Taller photos take more vertical room in the native scrolling reader. Click a photo to open the full-size image in a new tab. Images load lazily. Use WebP or JPEG, ideally around 1600 pixels on the longest edge and under 500 KB each; avoid uploading full-resolution camera files.

Leave `photos: []` or omit `photos` to keep an entry text-only, with no empty image box. The same field also works for Experience and the other sections. No React edits, image service, or API keys are needed.

## Richer entries

These optional fields work on any item in any section. Leave a field out and nothing is shown for it.

### Write-ups

`writeup` adds headed parts below an entry's highlights and links. Each part needs a `heading` and at least one of `text`, `steps` or `list`:

```js
writeup: [
  { heading: 'The problem', text: ['One paragraph.', 'A second paragraph.'] },
  { heading: 'How it works', steps: ['First step.', 'Second step.'] },   // Numbered, joined by a line.
  { heading: 'What’s next', list: ['A bullet.', 'Another bullet.'] },
],
```

`text` may be one string or an array of paragraphs. Use `steps` for a process that happens in order and `list` for points that do not. Headings must be unique within an entry.

The Threshold and SymptomAI write-ups were drafted on November 10, 2026 from each project's Devpost page (and Threshold's live app). They describe the team's work as "we" and add no numbers beyond those pages. Please read them and correct anything that is not how you would say it, especially which parts were yours.

### Key terms

`terms` adds a compact "Key terms" list under an entry:

```js
terms: [
  ['CTA', 'A CT scan taken with contrast dye, so arteries stand out clearly in 3D.'],
],
```

Keep it to **three** terms per entry, each a short name and one or two plain sentences. All four Experience entries have them. They define vocabulary only; in particular the Boston Scientific entry says nothing about methods or pipelines.

### Posters

`poster` shows a preview that opens a zoomable viewer (zoom buttons or + / −, scroll or drag to pan, Escape to close):

```js
poster: {
  src: '/posters/my-poster.webp',            // Full-size image, ideally about 4000 px wide.
  preview: '/posters/my-poster-preview.webp', // Optional smaller image for the entry, about 1600 px wide.
  width: 4098, height: 2304,                  // Pixel size of `src`.
  alt: 'Describe what the poster shows and its main sections.',
  caption: 'Optional caption.',
},
```

Put the files in `public/posters/` and note where they came from in `public/posters/README.md`. A photo of people or a screenshot belongs in `photos` instead.

### The "Now" note

About Me has an entry with `id: 'now'`. Edit its three `highlights` and its `period` ("Updated November 2026") whenever your focus changes. It appears only in About Me.

### Course catalog summaries

Each course has `catalog` (a short description) and `catalogUrl` (its source). The current text is a placeholder paraphrased from the public Boston University and UC Santa Cruz catalogs on November 10, 2026. It appears in the Courses map under "From the course catalog". Replace `catalog` with what you took from the course, in your own words, and remove `catalogUrl` if it no longer applies.

### Opening captions

The three words that appear while scrolling the home page ("Structure", "Flow", "Ideas") are in `src/intro.mjs`, not in `portfolio.mjs`. They are a layer label and one word each, by design. See [INTERACTIONS.md](INTERACTIONS.md).

## Section locations and camera views

Every section has an `anchor`, a preferred `callout` side, and a `view` with camera `position`, `target`, and `reveal` (0–100). These define the hotspot, its label’s preferred side of the head and the camera/layer preset when opened. The positions are a storytelling index, not a claim about where activities occur in the brain. The shared anatomy registration is applied automatically to the anchors.

Adding items does **not** require changing these values. When adding an entirely new section, add its complete definition and update the known-route pattern in `vercel.json`; existing sections and their routes are derived automatically. Labels are placed automatically in compact gutters beside the head, with connectors to their projected anchors and vertical spacing to avoid overlap. The seven approved sections should remain recognizable.

## Résumé and sources

The served résumé is `public/arush-vyas-resume.pdf`, updated from the résumé supplied for this task. The header's Résumé button and the footer link both open this file, so replacing it (same name) updates both. Project/experience/publication/award copy is a concise adaptation of the supplied résumés, with personal context from the existing site. SymptomAI uses the previous supplied résumé because it is not in the newer one. The course titles, codes, and university associations were supplied directly by Arush; their catalog summaries are placeholders from the public catalogs. The Threshold and SymptomAI write-ups come from their Devpost pages, and the research poster is slide 1 of the supplied `Vyas.Arush.Final.pptx`. Project screenshots and award photos were supplied by Arush in `Archive.zip`: Threshold, SymptomAI, MedAI, DS + X, and Hackathon for Public Health Equity. The last photo belongs to the existing May 2024, 1st Place Overall award. Add richer case-study text as it becomes available.

## Check your change

```bash
npm run build
npm run test:sites
npm run test:regression
```

Start `npm run dev` and check your entry using its index link and scroll. The optional `tests/browser-smoke.cjs` acceptance suite also verifies a data-only fourth-project addition in the running development app without changing components.

The optional `tests/browser-scene.cjs` test checks full-motion camera interruption, pointer orbit, wheel zoom and reset. Both browser scripts require Playwright and Chromium in the test environment; `CHROMIUM_PATH` can select the browser binary.

`node tests/browser-photos.cjs` checks photo galleries against a running Vite development server using temporary local images. It covers multiple/single/no-photo entries, keyboard/Previous/Next navigation, full-size links, preserved reader/camera state and mobile sizing. Fixtures are cleaned up and are never published as portfolio photos.

## VascuPath research explorer

The VascuPath item's `experience: 'brain-slice'` enables its interactive entrance. Research figures are defined separately in `src/content/vascupath.mjs`, with their original files under `public/vascupath/`. Use a shared `viewGroup` only for aligned images of the same tissue section. See [VASCUPATH.md](VASCUPATH.md) for the full editing guide and the distinction between the illustrative anatomy and supplied research figures.


### Courses vessel map

The Courses preview uses the same `courses.items` content plus a small relationship manifest in `src/content/course-map.mjs`. Add course titles/codes/affiliations to `portfolio.mjs`, assign their IDs to a branch, and add proposed work connections in the manifest. Compact labels are optional; full titles remain in the detail and catalogue. See `COURSE-MAP.md` for examples and relationship rules.
