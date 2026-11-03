# Sema's pages

Every page in the app, one line each, with its address and file. For the developer tools,
see `docs/dev.md`. This describes the pages as built on 2026-10-27;
`src/app/routing/router.js` (the address list) and each page's file are the source of truth, so
update this document when a page is added, renamed or moved.

## Main pages

| Page | Address | File | What it's for |
| --- | --- | --- | --- |
| Welcome | `/` | `src/pages/onboarding/WelcomePage.jsx` | The first thing a new visitor sees, in Duolingo's layout (2026-11-02): a bare header with the theme button, then the logo on the left and, beside it, "Learn ASL fingerspelling with your webcam" with the Get started button under it. Redesigned 2026-10-31; until 2026-11-02 it had a name tag that fingerspelled a typed name, then a "WELCOME to" sticker, then a centred column with a paragraph. |
| About | `/about` | `src/pages/about/AboutPage.jsx` | What Sema is, how it works and how it handles your data: three sections in one scrolling page, in the menu. It was three intro pages until 2026-10-27 (`/how-it-works` and `/privacy` redirect here). |
| Camera check | `/camera-setup` | `src/pages/onboarding/CameraCheckPage.jsx` | Setup's one page, opened by Get started: one hand, left or right, whole for 3 s, then Start learning opens Learn (or, with `?next=/quiz/words`, Start the Words quiz). Until it has passed once, "No camera? Guess letters instead" under the button finishes setup without it and opens Guess the letter (2026-11-04). It was at `/setup/camera` until 2026-10-29 (that address redirects here). |
| Learn | `/learn` | `src/pages/learn/LearnPage.jsx` | The main page, laid out like the quiz since 2026-11-02: the letters one at a time from A (or pick any in the guide, a row of all 26 across the top, with a tick on each one passed during the visit), each with the camera, the letter's drawing (or, with the picture's own 2D | 3D switch, the 3D hand) and a finger checklist; hold it 1.5 s, then Next letter. It was two pages until 2026-10-27, Learn and Practice (`/practice`, which redirects here). |
| Quiz | `/quiz` | `src/pages/quiz/QuizPage.jsx` | The choice: Words or Guess the letter (2026-11-04; before, Letters or Words). Redesigned 2026-11-01 in the camera check's sticker look (a score tag and tiles on the results). |
| Words quiz | `/quiz/words` | `src/pages/quiz/WordsQuizPage.jsx` | 5 words signed from memory with the camera, run by `QuizFlow.jsx` (no drawings, no hints but a Peek); each letter checked as on Learn, or skipped; then the score. Before the camera check has passed, it sends the person to the check. |
| Guess the letter | `/quiz/guess` | `src/pages/quiz/GuessQuizPage.jsx` | 2026-11-04: 10 hand pictures (`GuessRun.jsx`; J and Z left out), the person names each letter with a tile or its key; no camera. Then the score, right, wrong or skipped. Replaced the Letters quiz (`/quiz/letters`, which redirects to `/quiz`). |

A new visitor goes Welcome → Camera check → Learn: Get started (on Welcome, or at the end of
About) opens the camera check, and passing it finishes setup. Without a camera the check can
be skipped, which also finishes setup and opens Guess the letter; Learn's camera frame then says
"Set up your camera" until the check passes. A new visitor opening Learn or
Quiz is sent to Welcome first; a returning visitor opening `/` goes straight to Learn. About is
optional: Welcome doesn't link to it, and it's in the menu on the main pages. Old addresses
redirect: `/try`, `/practice`, `/dev/try` and `/record` to `/learn`; `/setup/camera` and
`/setup/hand` to `/camera-setup`; `/how-it-works`, `/privacy` and `/setup/how-it-works` to
`/about`; `/quiz/letters` to `/quiz`. Any other address shows **Page not found** (`src/pages/not-found/NotFoundPage.jsx`,
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
