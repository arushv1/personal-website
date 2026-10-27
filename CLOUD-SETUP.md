# Codex Cloud setup for this website

Status: the repository is prepared for cloud setup. This file does not create or publish a cloud environment, start a cloud task, or schedule recurring work. Complete the account-side steps below first.

## Create the environment

1. In Codex, start a new chat and choose **Work in → Cloud → Select environment → Create environment**. The alternative route is **Settings → Codex Cloud → Environments → Create environment**.
2. Select only `arushv1/personal-website`, using the current `main` branch. Complete GitHub connection prompts if needed.
3. Select **Get started**. Give the setup agent the prompt below.
4. Review the setup and verification results, save, and select **Publish**. Wait for **Environment published** before starting work.
5. Start a new task in that published environment. A local chat does not migrate to Codex Cloud automatically.

Official instructions: https://learn.chatgpt.com/docs/environments/cloud-environments

## Paste this into the environment setup conversation

```text
Prepare a private Codex Cloud environment named personal-website for the
arushv1/personal-website repository, starting from current main.

Read AGENTS.md and README.md. Work from the repository root. This is a
React 19 / Vite 6 / Three.js website, with a committed npm lockfile and
all required model assets already in Git. Use Node.js 22.12 or newer
within the Node 22 line and npm.

Install with npm ci. Verify by running npm run build followed by
npm run test:sites, in that order. The four packaging tests require the
build output. Expect dist/client/index.html, dist/server/index.js, and
dist/.openai/hosting.json. The existing Vite chunk-size advisory is not
a build failure.

Use npm ci as the reusable install command. Record the development
startup command as npm run dev -- --host 0.0.0.0 if previewing the app
is supported in this environment. No app secrets, environment variables,
database, or Meshy account are required for local code/build work.
Use the standard package-manager network access for installation.

Do not regenerate models during setup. Do not change source code,
dependency versions, hosting settings, or repository visibility merely
to prepare the environment. Report the Node version, install result,
build result, and all four test results before I publish it.
```

## Context for the first work task

- Read `AGENTS.md` first. It records Arush's design decisions and rejected approaches. Keep the real textured avatar, shared anatomy scene, and current visual direction.
- The existing public website is https://personal-website-brown-psi-69.vercel.app. Main-branch pushes trigger its Vercel deployment.
- `reference/` contains the selected layout and avatar references. `qa/` contains browser screenshots; `design-qa.md` records the latest verified implementation.
- `source-assets/avatar/meshy-avatar-textured.glb` is the original model. `public/models/avatar.glb` is its optimized web derivative. Run `prepare:avatar` only when changing the model or its preprocessing.
- The avatar is an artistic likeness. The internal anatomy is generic and illustrative. Never present it as Arush's actual scan.
- Cloud tasks do not automatically inherit local browser sign-ins, desktop apps, or uncommitted local files. This repository contains the necessary application files; Meshy browser access is not needed for ordinary implementation.
- Check the cloud environment's actual visual verification capabilities. If browser rendering is unavailable, report that limit and leave new visual QA pending. Existing screenshots are historical evidence, not proof of a new change.
- Work on a branch and return reviewable changes and test results. The first task can request a PR; do not infer an automatic production release or indefinite recurring work from environment creation alone.

## Starting a work task

Arush selected two workstreams: shareable chapter URLs/browser history and a smoother avatar-to-anatomy reveal. The complete scope and acceptance checks are in `CLOUD-TASK.md`. Give the published environment this prompt:

```text
Read AGENTS.md, CLOUD-SETUP.md, and CLOUD-TASK.md in arushv1/personal-website.
Implement both requested workstreams in CLOUD-TASK.md: shareable chapter
URLs with correct direct-load/refresh and browser Back/Forward behavior,
and a substantially smoother, better-aligned You-to-Within 3D reveal.
Preserve the accepted design and real 3D assets. Complete the acceptance
checks, report any unavailable visual verification, and return reviewable
changes with results. Work through implementation, not just a proposal.
```

A task continues toward its assigned outcome; publishing an environment alone does not start work. Cloud availability and permissions depend on the signed-in account/workspace.
