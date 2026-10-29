# Courses vessel map

This feature replaces the Courses list with a selectable course-to-work map, based on `reference/course-vessels.png`. The existing anatomical model remains real and interactive. Arush approved preview `0e64585` on October 29 and requested release to main and Vercel through PR #7. Release preparation changes documentation only; verify the main merge commit's Vercel status before reporting deployment complete.

## Content

`src/content/portfolio.mjs` is the authoritative course catalogue: 13 unique titles, codes and supplied university affiliations. No completion dates, grades or course outcomes have been inferred. ENGBE 209 appears once; BME160 retains its University of California, Santa Cruz association.

`src/content/course-map.mjs` contains:

- `courseBranches`: Computation & AI, Biomedical Systems, Health & Design, each listing course IDs.
- `workNodes`: stable IDs resolving to existing project or publication items.
- `connections`: `{courseId, workId, summary}` relationships. These are explicitly proposed thematic links; contribution wording should be replaced with confirmed examples when supplied.
- `courseLabels`: optional compact node labels; full titles remain accessible and appear in the detail/catalogue.
- `courseSkills`: short candidate skill labels used in the detail/chips.

To add a course, add its catalogue item and ID to one branch. Add skill/compact labels and connections as appropriate. The count and catalogue update automatically. To add work, define its target section/item and add connections. Example:

```js
{courseId:'introduction-engineering-hands-on', workId:'threshold',
 summary:'Explore how hands-on engineering can turn a health-access question into an interactive prototype.'}
```

Every connection must resolve to real IDs. A course can remain a broader foundation without a direct project connection. Thermodynamics uses this state, rather than receiving an invented application.

## Behavior

The default selection is Hands-On Engineering under Health & Design. One branch expands at a time; long branches scroll internally. Course selection highlights every connected work node. Work selection highlights supporting branches/visible courses and lists all supporting courses as chips. Selecting a chip opens its course's branch. A native catalogue exposes all 13 complete entries and brings the chosen course back into view.

`/courses#<course-id>` and `/courses#work-<work-id>` restore selection, including browser Back/Forward. Selection does not move the 3D camera or change Look within. Native View project/publication links preserve the optional reveal comparison query and lead to the existing section/item, where normal camera navigation runs. Modified clicks/new tabs work normally.

The vessels are functional data-driven paths. ResizeObserver keeps their tapered shapes aligned with branch and work buttons; only color/opacity transitions run on selection. There is no force layout or frame loop. HTML buttons provide the interactions and text relationships, while the SVG is hidden from assistive technologies. Mobile keeps the map readable in two columns and the existing anatomy below; touch targets are at least 44px. Reduced motion disables transitions.

## Verification

```bash
npm run build
npm run test:sites
npm run test:regression
PREVIEW_URL=http://127.0.0.1:5187 node tests/browser-course-map.cjs
PREVIEW_URL=http://127.0.0.1:5187 node tests/browser-smoke.cjs
```

The browser checks require separately installed Playwright and Chromium. `qa/course-vessels/` records the interactions and source comparison; `design-qa.md` records the initial layout issue and its correction. Cloud SwiftShader establishes layout/interaction behavior, not physical-phone GPU performance.
