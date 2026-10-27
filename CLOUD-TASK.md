# First cloud task: shareable chapters and a seamless anatomy reveal

Status: scoped and ready to assign. A cloud task has not been started by adding this file. Read `AGENTS.md` and `CLOUD-SETUP.md` before implementing.

## Arush's requested outcome

1. Make chapters shareable. The URL currently stays unchanged during navigation, so a recruiter cannot receive a direct Research link and browser Back does not follow chapter navigation. Give chapters their own URLs and make browser navigation behave naturally.
2. Polish the avatar and reveal transitions. Arush reports that the 3D avatar does not blend well into the bones and vessels, and that moving from You to Within looks choppy. Make this a continuous, clean reveal of the same person rather than visibly disconnected layers.

Implement both workstreams. Preserve the existing black/white/red layout, personal content, real textured avatar, interactive orbit/zoom, anatomical credits, and accessible controls.

## 1. Shareable chapter URLs

Give Research, Roots, Making, Setup, Stories, and About stable, copyable URLs. Prefer clean paths such as `/research`, with `/` for home and a consistent URL for the atlas overview. Keep URL state and displayed content synchronized from initial page load onward.

Requirements:

- Opening a chapter through header navigation, the atlas list, a model hotspot, or chapter navigation updates the address bar.
- Opening `/research` directly displays Research without requiring a home-page click. Refresh and opening that URL in a new tab work.
- Browser Back/Forward restores the previous/next page or chapter. Handle browser history events without adding a new history entry in response. Re-selecting the current route should not spam history.
- Keep the site’s Back to the atlas and home actions consistent with the URL. A visitor who arrives directly at a chapter can still navigate to the atlas and home without being sent away from the site.
- Use meaningful link destinations for navigation so copying a link and normal modified-click/new-tab behavior work. Keep hotspot names, keyboard navigation, focus movement, and mobile chapter scrolling usable.
- Give chapter pages meaningful document titles. Preserve the contact/credits dialogs and external links.
- Configure the existing static Vercel deployment to serve direct chapter requests. Local Vite fallback alone is insufficient. Scope rewrites appropriately so model, decoder, resume, and other asset requests keep working.
- Define a sensible unknown-URL behavior. Preserve working home, resume, and model URLs.

Relevant files: `src/App.jsx`, `src/AnatomyScene.jsx`, `src/styles.css`, `vercel.json`, and the existing static/Sites packaging. Use the smallest maintainable routing approach consistent with the app; a framework migration is outside this task.

## 2. Seamless You → Bone → Vessels → Within

First reproduce the current reveal at the same camera angle, including intermediate values, fast changes, and reversing direction. Check input responsiveness separately from visual registration and transparent-material rendering.

Code observations to investigate, not established root causes:

- The reveal currently uses a fixed `.095` interpolation factor per rendered frame; camera easing also uses a fixed factor. Rendering is throttled near 50 fps, so response can vary with frame rate.
- Adjacent layers use overlapping opacity windows. The avatar fades between reveal 5–32, bone appears at 4–26, vessels at 34–68, and cortex at 77–98. Intermediate states need inspection, not only the four shortcuts.
- Materials switch `depthWrite` when opacity crosses `.98`, and whole models switch visibility at `.005`. Fixed render ordering and transparent surfaces may produce pops, ghosting, or sorting artifacts; verify actual browser behavior before choosing a fix.
- The avatar's scale/translation and shared internal lower-neck compression were set for the first integration. Recheck the registration of forehead, eyes, jaw, neck, and shoulders against the actual avatar, especially from front and side. A common scene transform alone does not guarantee convincing alignment.

Requirements:

- Keep a stable camera and viewing angle throughout manual reveal. Pause automatic orbit during active manual manipulation so the subject does not drift underneath a scrub. Preserve wheel/pinch zoom and vertical mobile page scrolling.
- Use time-based smoothing or another measured approach that responds promptly at different frame rates. Fast forward/back scrubbing must not snap, overshoot, or trail behind for an excessive period.
- Make the geometry, reveal timing, and depth treatment read as one continuous transition. Inspect for double faces, anatomical structures floating outside the head, sudden opacity/depth changes, and a blank interval between stages.
- If opacity crossfading cannot produce a clean result, evaluate a controlled spatial or dithered reveal using the existing real meshes. Choose the approach from visual evidence, preserving the user’s requested artistic direction.
- Keep the avatar, skull, arteries, and cortex in the same rotatable 3D scene. Preserve the original textures and reversible source assets. A static portrait, photo plane, CSS parallax, or cut between unrelated camera views does not meet the request.
- Reversing the reveal restores the same avatar at the same viewing angle. All four shortcuts remain usable, and Explore within/chapter navigation still reaches the internal atlas.
- Keep reduced-motion handling, range value text, keyboard alternatives, loading/error behavior, and reasonable GPU/download cost. Avoid a paid generation dependency; this task should work from the committed models.
- Explain illustrative registration honestly. The internal anatomy is generic and must not be described as Arush’s actual scan.

## Acceptance checks

### Navigation

1. Load a direct Research URL, refresh it, and open it in a new tab.
2. Follow home → atlas → Research → Roots, then browser Back twice and Forward twice. Confirm URL, title, selected chapter, and visible content agree at every step.
3. Check header, model hotspot, chapter pager, Back to the atlas, and home navigation, including keyboard and a narrow mobile viewport.
4. Verify direct routes on a deployed preview when available, plus successful model/decoder/resume asset requests. Report any Vercel access or preview limitation precisely.

### Reveal

1. Compare before/after at matching front, three-quarter, side, and back views. Inspect intermediate reveal values as well as 0/34/68/100.
2. Scrub slowly, jump quickly between endpoints, and reverse halfway through. Check that the camera remains stable and no depth/visibility pop or apparent geometry jump occurs.
3. Check pointer orbit, wheel/pinch zoom where supported, keyboard controls, shortcuts, and atlas entry after the reveal changes.
4. Check desktop, short laptop, 390 px mobile, and 320 px minimum width. Observe motion at more than one achievable frame rate if tools allow; do not infer smoothness from endpoint screenshots.
5. Capture visual evidence of the transition, ideally a short recording or a sequence of intermediate frames. Update `design-qa.md` from the new evidence. Historical screenshots and the previous passing report do not establish that this complaint is resolved.

Run `npm run build` and then `npm run test:sites`. Add focused regression coverage for the new navigation behavior and any transition logic where it catches real regressions. Inspect browser warnings/errors. If the cloud environment cannot render the site, complete the code/build checks and explicitly leave visual verification pending rather than claiming a smooth visual result.

## Delivery

Return a reviewable branch or pull request with the implemented changes, checks, screenshots/recording when available, and any remaining limitations. Follow the task's release instructions; environment creation alone does not authorize a recurring job. Update the project context with the final route scheme and reveal approach. Do not leave this as an audit-only report or a plan.

## Launch prompt

Paste this into a new task in the published `personal-website` cloud environment:

```text
Read AGENTS.md, CLOUD-SETUP.md, and CLOUD-TASK.md in arushv1/personal-website.
Implement both requested workstreams in CLOUD-TASK.md: shareable chapter
URLs with correct direct-load/refresh and browser Back/Forward behavior,
and a substantially smoother, better-aligned You-to-Within 3D reveal.
Preserve the accepted design and real 3D assets. Complete the acceptance
checks, report any unavailable visual verification, and return reviewable
changes with results. Work through implementation, not just a proposal.
```
