# Sema: Development Plan

## What Sema is

Sema is a browser-only ASL fingerspelling coach (English A–Z). It checks a letter's handshape from 21 hand points, found with MediaPipe in the webcam picture; video never leaves the device.
It's a portfolio project by Lanix Iligan, a CS student, built in stages: webcam, hand tracking, letter recognition, then the learning app.
Filipino Sign Language comes only after the American version is finalized.

## Phases

- Phase 0, render the webcam: done.
- Phase 1, hand tracking: done (deployed on Vercel).
- Phase 2, recognition (8 letters plus "no letter"): now. The recorder (2.1) is built on `phase-2-1-recorder`. Next come the pilot recording, training (2.2), the live classifier (2.3) and finger hints (2.4).
- Phase 3, the designed pages: now. The shell and setup (3.1) are built early on `phase-2-1-recorder`, and the onboarding pages were rebuilt (2026-10-18); a final frontend polish comes before merging into `main`. Learn and Practice (3.3–3.4) come next, on `phase-3-preview`.
- Phase 4, the remaining letters, then finalizing the American version: next.

## Current page sequence

The copy for these pages: docs/onboarding-pages.md (to be added).

- Welcome: `/`
- About Sema: `/about`
- How Sema works: `/how-it-works`
- How Sema handles your data: `/privacy`
- Camera check: `/setup/camera` (setup's one page: Sema must see both hands)
- Record: `/record` (returning visitors start here)
- Learn: `/learn` (a placeholder until 3.3)
- Practice: `/practice` (a placeholder until 3.4)
- Developer page: `/dev` (not in the menu)

## Decisions made

- ASL fingerspelling, English A–Z. Say "ASL fingerspelling", never just "sign language". Sema matches shapes; never say it understands signs.
- Letters come in stages. The first 8 are B, C, D, F, I, L, W, Y, plus "no letter". Then the other static letters, then the fist letters (A, M, N, S, T), then J and Z.
- Browser only: no backend, database or accounts until Phase 5. Recorded hand points stay private in `data/raw/`.
- Desktop first. Phone layouts aren't a goal yet.
- React, Vite, plain JavaScript and plain CSS. No new dependencies without asking Lanix. Python runs only offline, to train the classifier.
- Setup doesn't ask which hand the user signs with (2026-10-18; before, a Signing hand page asked). The camera check makes sure Sema sees both hands whole, together, for 3 seconds; the signing hand starts as Right and is switched with the hand toggle in the camera controls. Left hands are flipped to look like right hands before classifying.
- Switching Left/Right lives in the camera controls of each camera view (2026-10-16). On Record it picks the hand for the next take; on Learn and Practice it will change the setting.
- Hosting is Vercel. There is a privacy page but no cookie banner, because there are no analytics or tracking.

## Parked

- Phase 5, sign-in: optional and guest-first (leaning Supabase). Sema stays usable without an account.
- Phase 6, Filipino Sign Language: after the American version is finalized. It needs a verified source and a fluent reviewer.
- Which hand drives the left-hand flip: the detected hand or the signing-hand setting. Leaning toward the setting.
- What "Next letter" picks: the teaching order or the next unmastered letter. Decide in 3.3.
- When Practice unlocks: 3 mastered letters is a starting guess. Decide in 3.4.
- Whether to add the Kaggle ASL images to the training data. Decide in 2.2.
- What "finalized" means: all 26 letters working, or some marked lower confidence. Leaning toward the second.
- The rest of 3.2: the top-bar hand pill's menu (Reset progress) and per-letter progress.
