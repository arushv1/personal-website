# Arush Vyas: Personal Website

A single long page personal website for Arush Vyas, built with Next.js and React.
It covers both audiences in one arc: employers and researchers.

## Sections, in order

1. **Intro**: headline, subhead, and contact links.
2. **Education**: Boston University, BS Biomedical Engineering, expected May 2027, GPA 3.83.
3. **Experiences**: Boston Scientific (Health AI Engineering Intern), Tian Lab
   (Undergraduate Deep Learning Researcher), and BTEC Lab (Lab Assistant).
4. **Projects**: VascuPath, the Boston Scientific 3D CTA segmentation pipeline,
   the BTEC AI knowledge base, and Threshold, one project per scroll section.
5. **Awards**: recognition shown as a graphic collage, not a plain list.
6. **Publications**: the published paper, a placeholder for the planned
   VascuPath manuscript, and research direction.
7. **Courses**: entirely placeholders for Arush to fill in. No course list is
   on record, so no course names are shown.
8. **Contact**: email, LinkedIn, GitHub, and location, with a resume download
   slot once a PDF is added.

The header navigation links to each section. The design uses Arush's imaging
work as its visual language: vessel lines, whole slide tiles, and CTA volumes,
in a strict two color system (dark by default, with a light mode toggle).
Motion follows the same idea: a vessel line draws itself as its section
scrolls into view, and slide tiles scale up tile by tile, like zooming into
a slide. Motion uses transform, opacity, and stroke only, so it never reflows
the readable central column, and it is disabled entirely for visitors who
prefer reduced motion.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. For a production check, run `npm run build`
followed by `npm run start`.

## Edit the content

All copy lives in one file: `src/content.ts`.

Edit that file to change education, experiences, projects, awards,
publications, courses, and links. You do not need to touch layout code in
`src/app` or `src/components` to change copy. Motion components live in
`src/components/`: `VesselTrace` (the self drawing vessel line) and
`TileGrid` (the zooming slide tiles).

Anything only Arush can supply is marked "To add" in that file: tagline,
headshot, what he is looking for next, manuscript and poster links,
Threshold demo and repo links, resume PDF download, contact preferences,
and every Courses slot. To add a headshot or a resume PDF, place the file in
`public/` and put its path in `src/content.ts`.

To fill in Courses, replace the placeholder strings in the `courses`
section of `src/content.ts` with real course names, and add or remove slots
as needed. To fill in Publications, replace the planned VascuPath manuscript
placeholder with the real link when the manuscript is available. It is kept
as a placeholder on purpose: it must not be presented as published before it
is.

Writing rule for this site: never use em dashes in copy. Use commas, colons,
or separate sentences instead.

## Deploy on Vercel

No special config is needed.

1. Push this repo to GitHub.
2. In Vercel, import the GitHub repo.
3. Accept the default Next.js settings and deploy.

Every push to the repo's default branch redeploys automatically.
