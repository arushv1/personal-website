# Arush Vyas: Personal Website

A single long page personal website for Arush Vyas, built with Next.js and React.
It covers both audiences in one arc: employers (Experience, Projects, Skills,
Contact) and researchers (VascuPath, research interests, publication).

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. For a production check, run `npm run build`
followed by `npm run start`.

## Edit the content

All copy lives in one file: `src/content.ts`.

Edit that file to change projects, experience, research, awards, and links.
You do not need to touch layout code in `src/app` or `src/components` to
change copy.

Anything only Arush can supply is marked "To add" in that file: tagline,
headshot, About paragraphs, what he is looking for next, manuscript and
poster links, Threshold demo and repo links, resume PDF download, and
contact preferences. To add a headshot or a resume PDF, place the file in
`public/` and put its path in `src/content.ts`.

Writing rule for this site: never use em dashes in copy. Use commas, colons,
or separate sentences instead.

## Deploy on Vercel

No special config is needed.

1. Push this repo to GitHub.
2. In Vercel, import the GitHub repo.
3. Accept the default Next.js settings and deploy.

Every push to the repo's default branch redeploys automatically.
