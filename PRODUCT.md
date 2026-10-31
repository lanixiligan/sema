# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily hearing people learning to fingerspell the ASL alphabet, often to talk with a Deaf
friend or family member. They are motivated but can be anxious about getting it wrong, and
they practise at a desk in front of a webcam, with both hands busy while they sign.
Secondary: people reviewing Sema as Lanix Iligan's portfolio project (a CS student); they
benefit from Sema being genuinely good for learners rather than from a separate pitch.

## Product Purpose

Sema teaches the ASL fingerspelling alphabet (English A–Z) in the browser. It watches the
learner's hand through the webcam, checks the handshape of the letter they chose, and says
which finger to fix. Success is a learner who can fingerspell every letter and short words
from memory, and feels encouraged along the way.

## Positioning

Sema checks your actual hand, finger by finger, live, without the video ever leaving the
device: 21 hand points from MediaPipe, finger conditions numbered 1 (thumb) to 5 (pinky)
that match the numbers on the hand drawing, and J and Z traced in the air. It matches
shapes; it never claims to understand sign language.

## Operating Context

- Desktop-first, in Chrome or Firefox with WebGL; a webcam is required. Phone layouts aren't
  a goal yet (a notice says Sema is made for computers).
- Flow: Welcome → Camera check (both hands for 3 s) → Learn (one letter at a time, hold
  1.5 s to pass) → Quiz (10 letters or 5 words from memory, with a peek eye, then results).
  About explains how it works and how data is handled.
- The camera never starts by itself and stops when idle or hidden.

## Capabilities and Constraints

- React + Vite + plain JavaScript and plain CSS (`src/styles.css`); no UI or CSS framework,
  no new dependencies without asking.
- Every asset served from the app itself (fonts as `.woff2` in `public/fonts/` with their
  OFL licences); no CDN.
- No backend, accounts or analytics; nothing is saved yet except settings (no progress).
- Light, dark and system themes on every page.
- Terminology: "pages", not "screens"; "ASL fingerspelling", never just "sign language".

## Brand Commitments

- Name: Sema, written "sema." in the logo.
- Keep the mark (hand landmarks drawn as a constellation) and the logo SVGs in
  `public/logos/`, unchanged.
- Keep the 26 ink-line letter drawings in `public/images/asl/`.
- Keep the palette (Deep Cobalt #142C48, Bright Sky #36A7D9, Deep Sky #1A75A3, the sky
  tints, amber and error red); how much of each is used is open. Bright Sky is never text
  on a light background.
- Fonts are open to replacement (Plus Jakarta Sans and JetBrains Mono today).
- Voice: encouraging and warm. Energy reference (Lanix, 2026-10-31): Duolingo's loud,
  celebratory encouragement, without a mascot and without copying its look. Redesign decided 2026-10-31: everything may change, page by
  page, and the old "minimal and calm, no decoration" rule is being replaced.

## Evidence on Hand

- The letter drawings, the mark and logo, the fingerspelled L-O-S-T on Page not found.
- Real model results (`training/reports/`), the public datasets' credits
  (`docs/ATTRIBUTION.md`). No users, testimonials or usage numbers exist: never invent them.

## Product Principles

1. Your hand comes first: nothing moves or competes with it while you hold a letter.
2. Say which finger, not just "wrong": feedback is specific and kind.
3. Privacy is felt, not just stated: the camera is always in the learner's control.
4. Honest about the machine: Sema matches shapes and says so.

## Accessibility & Inclusion

Keyboard and screen-reader support matter (a pass is planned): hands are busy while signing,
so key actions should be reachable without the mouse. Respect reduced motion. Colour is
never the only signal (results, ticks).
