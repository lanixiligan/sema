# Where things stand (2026-10-16)

Branch `phase-2-1-recorder`. The last commit is `9e6618c`, which is also on
`origin/phase-2-1-recorder`. **Everything below is uncommitted.** Nothing has been pushed.
The only staged changes are six `git mv` renames, with no content changes (see "Done but
uncommitted"). `docs/design/` is gitignored and must never be committed.

This file is a working note. It isn't committed; decide whether to commit it or delete it.

## Done but uncommitted

**Planning docs**

- `docs/recorder-implementation-plan.md` is rewritten around five steps:
  1. recorder logic (tasks 1–5, done)
  2. app shell (Task 6)
  3. Welcome and setup (Task 7)
  4. Record page (Task 8)
  5. Learn and Practice placeholders (Task 9)

  Task 10 is the whole-branch check. The plan also covers the folder layout, the
  decisions made so far, and the rulings made while building.
- `docs/recorder-design.md` (the spec):
  - Record is a page inside the app, with no `record.html` and no `noindex`.
  - The shared camera starts by itself.
  - The hand toggle starts on the signing hand.
  - The 2a wording is settled.
  - **Consent:** training only; publishing is out of scope.
- `docs/project-plan.md`:
  - 3.1 was built early on this branch, and 3.3–3.4 stay for `phase-3-preview`.
  - The setup order is How Sema works → signing hand → camera.
  - The fonts are noted.
- `CLAUDE.md`:
  - `docs/design/` is local-only.
  - Terminology: "pages", not "screens".
  - New notes on routing, settings, the camera rule and the folder layout.
- `.gitignore`: `docs/design/`.

**Task 6: app shell**

- **Routing:** one HTML file and a hand-written router (`src/app/router.js`,
  `navigation.js`, `Link.jsx`). `vercel.json` rewrites every path to `index.html`;
  `record.html` and the second Vite entry are gone.
- **Shared camera:** `CameraProvider` plus `src/components/CameraStage.jsx`. The camera
  is on exactly while a camera view is on screen, and the hand model stays loaded across
  pages. `useCamera` gained `attachVideo`.
- **Shell parts:** the menu bar with Preview pills, and the phone notice (checked once
  when the page opens).
- **Look:** the design's colour tokens, and self-hosted fonts in `public/fonts/`:
  - Plus Jakarta Sans, variable, 61 KB
  - JetBrains Mono Medium, 94 KB
  - a 3,180-byte Noto Sans Mono subset holding σ ῆ μ α

  Each comes with its OFL licence.
- **`/dev`:** the Phase 1 page, unchanged, now at `src/pages/dev/DevPage.jsx`.

**Task 7: Welcome and setup**

- **Pages** in `src/pages/onboarding/`: Welcome, How Sema works, Signing hand and
  Camera check, plus `SetupBar`.
- **Settings:** `src/app/progressStore.js` keeps the signing hand and "setup done" in
  `localStorage` (key `sema.progress`).
- **Redirects:** new visitors go through setup; returning visitors who open `/` go to
  `/record`; the camera check needs a hand first.
- **Camera check rules** are in `src/vision/handChecks.js`.
- **Camera check errors:** each error has its own title and text from the design.
  `useCamera` now returns `errorKind`, and `useHandLandmarker` returns `errorName`.

**Folder reorganization**

- **Folders:**
  - `src/pages/{onboarding,record,learn,practice,dev}/`
  - `src/components/`
  - `src/app/`
  - Logic stays in `src/recorder/`, `src/vision/` and `src/camera/`.
- **Staged `git mv` renames:**
  - `RecorderApp.jsx` → `pages/record/RecordPage.jsx`
  - `ConsentForm`, `RecordingGrid`, `TakePanel` and `TakeOverlay` → `pages/record/`
  - `vision/BenchmarkPanel.jsx` → `pages/dev/`
- **Renames:** `HowItWorksPage` → `HowSemaWorksPage`, and the router key `howItWorks` →
  `howSemaWorks`.
- **Stand-ins:** Learn and Practice each have a stand-in until Task 9.

**Last verified:** `npm test` passes 90 of 90, lint is clean, and `npm run build`
works. The headless Chrome checks pass: Task 6 34 of 34, and Task 7 44 of 44 on the dev
server and on `vite preview`. The check scripts were scratch files in the session's temp
folder and aren't in the repo. The plan's "Shared: end-to-end harness" section describes
how to rebuild them.

## Approved commit plan (wait for Lanix's go-ahead)

Three separate commits. Several files changed in more than one task: `App.jsx`,
`router.js` and its test, `useCamera.js`, `styles.css`, `README.md`, `CLAUDE.md` and
`docs/project-plan.md`. So stage each commit with that task's version of each file, in
its new folder location. Then check out each commit in a temporary worktree and run
`npm test` and `npm run build`.

1. **Docs**:
   - files: the plan, the spec, the project plan, `.gitignore`, and CLAUDE.md's
     design-reference and terminology lines
   - message: `docs: plan the recorder inside the app shell`
2. **Task 6**, which also takes the six staged renames (approved):
   - message: `feat(shell): add app shell and menu (Phase 3.1, done early: the recorder
     now lives inside the app after setup)`
3. **Task 7**:
   - message: `feat(setup): add Welcome and the setup steps (Phase 3.1–3.2, done early:
     setup now leads into the recorder)`

The full message bodies are in the conversation, and the commit table is at the top of
the plan. Never push or merge without Lanix's say-so.

## Task 8 (Record page): built on 2026-10-16, uncommitted

The Record page now follows `Record.dc.html`: the consent step with two boxes, the
recording step (camera, hand toggle, letter card, result card, letter tiles, Finish and
download) and the finished step. Consent is training only (the design's publishing box is out of scope). The design's position hints and "had the other hand" wording are in. The
plan's Task 8 lists everything, including what was added that the design doesn't show.

Last checked: `npm test` 92/92, lint clean, build works. A headless Chrome run went
through consent, a kept and a not-kept take, and Finish and download; the file passes
`check-session`. The Task 6/7 browser check scripts were lost with yesterday's temp
folder and weren't re-run.

## What's next

1. **Commit**, once Lanix approves: docs, Task 6 (with the six staged renames), Task 7,
   and now Task 8, as separate commits.
2. **Task 9: Learn and Practice placeholders**, with Lanix's copy (in the plan's Task 9).
3. **Task 10:**
   - the whole journey on a production build
   - a fresh whole-branch review
   - Lanix's Chrome checklist
   - then finishing the branch (merge or push only on Lanix's say-so)

## Open questions

From Task 8, to confirm (the plan's Task 8 has the details):

1. **Added beyond the design:**
   - the "Last take kept" note
   - the "Continue your session?" offer
   - "Keep recording" on the finished step
   - the left-hand note under the instructions
   - the gradient behind the text over the video
2. **No Stop camera and no Delete while recording**, as in the design. OK?

From Task 7, to confirm:

8. **Wording the design doesn't show:**
   - "Waiting for your right hand" (before any hand appears)
   - "Whole hand in view" (when that check passes)
   - "The camera didn't start" (title for errors the design doesn't list)
   - "Hand tracking couldn't start" (title for hand-tracking failures other than no
     WebGL)
9. **Other-hand note:** "Sign with my left hand instead" switches the setting on the
   camera check itself, rather than linking back to step 2 as the design does.
10. **Phone notice:** its designed text says "the screens are designed for a laptop".
    Keep it, or change it to "pages"?

Housekeeping:

- `docs/design/sema-designs.zip` is empty; Lanix will delete it.
- The project plan's Status table still lists Phase 2 as "Not started". It changes at
  milestone M2 (the pilot), as the spec says.
