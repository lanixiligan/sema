# Sema: Development Plan

## What Sema is

Sema is a browser-only ASL fingerspelling coach (English A–Z). It checks a letter's handshape from 21 hand points, found with MediaPipe in the webcam picture; video never leaves the device.
It's a portfolio project by Lanix Iligan, a CS student, built in stages: webcam, hand tracking, letter recognition, then the learning app.
Filipino Sign Language comes only after the American version is finalized.

## Phases

- Phase 0, render the webcam: done.
- Phase 1, hand tracking: done (deployed on Vercel).
- Phase 2, recognition (the 24 static letters): done (2026-10-23, on `phase-2-2-training`). The recorder (2.1) is done (2026-10-18; built on `phase-2-1-recorder`, merged into `main`); Lanix recorded a first test session on 2026-10-20 (the 8 letters, both hands). Training (2.2) is done: `/dev/extract` turns public datasets' photos into hand points, and `training/` cleans them (`training/reports/cleaning-asl-hg.md`, `cleaning-aslyset.md`), then tests a k-NN (`training/reports/knn.md`) and two small models (`training/reports/small.md`). Logistic regression does best and is the model in the browser (14 KB, `public/models/asl-letters.json`): trained on ASL-HG and ASLYset (14 signers), 94.7% on ASL-HG's signers when each is held out (91.8% on ASL-HG alone; 18 of 24 letters at 90%+), and all 8 of Lanix's recorded letters on both hands. R, U, X, T and N (82–85%) are the weakest. The live check (2.3) is done as Try (`/try`, on the live site too; since 2026-10-23, Practice at `/practice`): Sema checks the letter the person picked and passes it after a 3-second hold while it's the model's sure guess (see "Target letter only" below). The finger hints (2.4) moved to Phase 3, with Learn's lessons. The model keeps improving while the next phases go on (more datasets, better hand measurements), judged by the same held-out tests.
- Phase 3, the designed pages: now. The shell and setup (3.1) were built early, with the recorder, and are done (2026-10-18). Practice (3.4) is Try, renamed and laid out like Record (2026-10-23; see "Practice is Try" below). Learn (3.3) comes next, on `phase-3-preview`, and the finger hints (from 2.4: which finger to fix, for a shape that doesn't pass) with Learn. B's came early (2026-10-23), because the model called an open hand B: shape rules on top of the model (`src/vision/landmarks/letterShapes.js`), whose failed rule is the hint. The other letters' rules come with Learn.
- Phase 4, the remaining letters (J, Z and any that didn't pass in Phase 2), then finalizing the American version: next.

## Current page sequence

The copy for these pages: [docs/onboarding-pages.md](onboarding-pages.md).

- Welcome: `/`
- About Sema: `/about`
- How Sema works: `/how-it-works`
- How Sema handles your data: `/privacy`
- Camera check: `/setup/camera` (setup's one page: Sema must see both hands)
- Learn: `/learn` (a placeholder until 3.3)
- Practice: `/practice` (returning visitors start here, and setup leads here: the classifier live, with a letter guide; the main page for now. `/try`, its old address, redirects here)
- Developer tools: `/dev`, a dashboard behind an access code (not in the menu), with `/dev/tracking`, `/dev/record` and `/dev/extract`

## Decisions made

- ASL fingerspelling, English A–Z. Say "ASL fingerspelling", never just "sign language". Sema matches shapes; never say it understands signs.
- Letters (2026-10-22; before, the first 8 alone, then the others in stages): the classifier is trained on all 24 static letters (A–Z but J and Z) from the start, since the training photos have them all. All 24 can be picked on Practice (2026-10-23; before, letters were to be switched on in stages as each passed the test in 2.2), and the weaker ones improve as the model does; the fist letters (A, E, M, N, S, T) and the sideways ones (G, H, P, Q) are expected to be the hardest. B, C, D, F, I, L, W, Y are also tested on Lanix's own recordings. J and Z move, so they come last: the first version of Sema is the 24 static letters, and J and Z are out of its scope until Phase 4 (2026-10-22). Training datasets only need the 24 (ASLYset has no J or Z).
- Target letter only (2026-10-23; before, "not sure" for hands that aren't a letter, tested on "none" recordings, and before that a "no letter" class): Sema always knows which letter it asked for (Learn, Practice) and only checks whether the hand is that letter, so there is no "none" anywhere, the recorder included. Sema doesn't read free fingerspelling with no target. "Not sure" stays: a guess under the confidence threshold never counts. Old sessions' "none" takes are skipped by training.
- Training data (2026-10-23; before, ASL-HG alone): public photos are the training data, and Lanix's own recordings the test. Since 2026-10-23 that's ASL-HG (10 signers) and ASLYset (4 signers), both CC BY 4.0 and credited in `docs/ATTRIBUTION.md` and the README. A dataset is added only if it raises the held-out score of the signers that were there before it (ASLYset: ASL-HG's signers 91.8% → 94.7%); other candidates (American Hand Signs, SignAlphaSet, Cabana's) don't say who signed each photo, so they could only train, never test. Training datasets only need the 24 static letters. Results across people come from holding out one signer at a time, never from a random split.
- Browser only: no backend, database or accounts until Phase 5. Recorded hand points stay private in `data/raw/`.
- Desktop first. Phone layouts aren't a goal yet.
- React, Vite, plain JavaScript and plain CSS. No new dependencies without asking Lanix. Python runs only offline, to train the classifier.
- Setup doesn't ask which hand the user signs with (2026-10-18; before, a Signing hand page asked). The camera check makes sure Sema sees both hands whole, together, for 3 seconds; the signing hand starts as Right and is switched with the hand toggle in the camera controls. Left hands are flipped to look like right hands before classifying.
- Switching Left/Right lives in the camera controls of each camera view (2026-10-16). On Record it picks the hand for the next take; on Practice (since 2026-10-23), and later Learn, it changes the setting.
- Hosting is Vercel. There is a privacy page but no cookie banner, because there are no analytics or tracking.
- Record is a developer tool (2026-10-22; before, the main page at `/record`, where setup led and returning visitors started): `/dev/record`, behind the access code, now that the classifier is trained and recording is only for the test set. Lanix gives the code to the people who record. Setup and returning visitors went to Learn, a placeholder until 3.3, and since the same day to Try, now Practice (below).
- Developer tools (2026-10-22): on the live site too, under `/dev`, behind an access code that is a keep-out sign checked in the browser (no server), not a lock. The classifier page left `/dev/try` the same day to become Try, now Practice (below).
- Practice is the main page for now (2026-10-23, as Try since 2026-10-22; before, Learn's placeholder, and the classifier was the developer tool `/dev/try`): `/practice`, where setup leads and returning visitors start, until Learn's lessons (3.3). It shows step 5's small model (14 KB), logistic regression; the 11 MB k-NN can be chosen on the `/dev` dashboard (2026-10-23; before, a switch on Practice itself), only under `npm run dev`. The camera waits for a click there, so opening Sema never turns it on.
- Practice is Try (2026-10-23; before, Try at `/try` was Practice's prototype and Practice a placeholder): Try was already what Practice was meant to be, so it was renamed and the placeholder removed; `/try` redirects to `/practice`, and the menu is Learn, Practice. Pick a letter in the guide, make it with either hand, and hold it for 3 seconds while it's Sema's sure guess; then "That's B!" and Try again, and the next letter is picked by hand (until 2026-10-22 Try showed Sema's guess for every hand). The guide shows all 26 letters: a dot marks the 8 tested on Lanix's recordings, and J and Z, which move, are darkened and can't be picked yet. Its layout is Record's (2026-10-23): the letter guide on the left, the camera with the Left | Right switch in the middle, and the letter on the right, its drawing large, with its steps.

## Parked

- Phase 5, sign-in: optional and guest-first (leaning Supabase). Sema stays usable without an account.
- Phase 6, Filipino Sign Language: after the American version is finalized. It needs a verified source and a fluent reviewer.
- Which hand drives the left-hand flip: the detected hand or the signing-hand setting. Leaning toward the setting.
- What "Next letter" picks: the teaching order or the next unmastered letter. Decide in 3.3.
- When Practice unlocks: 3 mastered letters is a starting guess. Decide in 3.4.
- What "finalized" means: all 26 letters working, or some marked lower confidence. Leaning toward the second.
- The rest of 3.2: the top-bar hand pill's menu (Reset progress) and per-letter progress.
