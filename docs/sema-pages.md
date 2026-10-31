# Sema's pages

Every page in the app, one line each, with its address and file. For the developer tools,
see `docs/dev.md`. This describes the pages as built on 2026-10-27;
`src/app/routing/router.js` (the address list) and each page's file are the source of truth, so
update this document when a page is added, renamed or moved.

## Main pages

| Page | Address | File | What it's for |
| --- | --- | --- | --- |
| Welcome | `/` | `src/pages/onboarding/WelcomePage.jsx` | The first thing a new visitor sees: a "HELLO my name is" tag that fingerspells the name typed on it (never saved), and one button, Get started. Redesigned 2026-10-31. |
| About | `/about` | `src/pages/about/AboutPage.jsx` | What Sema is, how it works and how it handles your data: three sections in one scrolling page, in the menu. It was three intro pages until 2026-10-27 (`/how-it-works` and `/privacy` redirect here). |
| Camera check | `/camera-setup` | `src/pages/onboarding/CameraCheckPage.jsx` | Setup's one page, opened by Get started: one hand, left or right, whole for 3 s, then Start learning opens Learn. It was at `/setup/camera` until 2026-10-29 (that address redirects here). |
| Learn | `/learn` | `src/pages/learn/LearnPage.jsx` | The main page: the letters one at a time from A (or pick any in the guide of all 26), each with the camera, the letter's drawing (or, with the card's 2D | 3D switch, the 3D hand) and a finger checklist; hold it 1.5 s, then Next letter. It was two pages until 2026-10-27, Learn and Practice (`/practice`, which redirects here). |
| Quiz | `/quiz` | `src/pages/quiz/QuizPage.jsx` | The choice: Letters or Words. Each has its own page, `/quiz/letters` (`LettersQuizPage.jsx`) and `/quiz/words` (`WordsQuizPage.jsx`), run by `QuizFlow.jsx`: signed from memory (no drawings, no hints); each letter checked as on Learn, or skipped; then the score. |

A new visitor goes Welcome → Camera check → Learn: Get started (on Welcome, or at the end of
About) opens the camera check, and passing it finishes setup. A new visitor opening Learn or
Quiz is sent to Welcome first; a returning visitor opening `/` goes straight to Learn. About is
optional: Welcome doesn't link to it, and it's in the menu on the main pages. Old addresses
redirect: `/try`, `/practice`, `/dev/try` and `/record` to `/learn`; `/setup/camera` and
`/setup/hand` to `/camera-setup`; `/how-it-works`, `/privacy` and `/setup/how-it-works` to
`/about`. Any other address shows **Page not found** (`src/pages/not-found/NotFoundPage.jsx`,
2026-10-29; before, it quietly went to Welcome), with one button back to the start.

## Developer pages

Behind an access code, not in the menu, but live on the deployed site too. Full detail in
`docs/dev.md`.

| Page | Address | File | What it's for |
| --- | --- | --- | --- |
| Dashboard | `/dev` | `src/pages/dev/DevDashboard.jsx` | A card per tool, plus the latest training results. |
| Tracking | `/dev/tracking` | `src/pages/dev/tracking/` | The Phase 1 hand-tracking page, with the performance benchmark. |
| Extract | `/dev/extract` | `src/pages/dev/extract/` | Runs a public dataset's photos through Sema's hand model and normalization. |
| Record | `/dev/record` | `src/pages/dev/record/` | Records labelled sessions for training; the app's main page until 2026-10-22. |

## Not yet built

- Progress: nothing is saved yet. Learn always starts at A, Next letter goes in A to Z order,
  and quiz results aren't kept (per-letter progress is parked in the plan).
