# Sema's pages

Every page in the app, one line each, with its address and file. For the onboarding flow's
full detail (what each one says, the order, the shared layout), see `docs/onboarding-pages.md`;
for the developer tools, see `docs/dev.md`. This describes the pages as built on 2026-10-24;
`src/app/routing/router.js` (the address list) and each page's file are the source of truth, so
update this document when a page is added, renamed or moved.

## Main pages

| Page | Address | File | What it's for |
| --- | --- | --- | --- |
| Welcome | `/` | `src/pages/onboarding/WelcomePage.jsx` | The first thing a new visitor sees; one button, Get started. |
| About Sema | `/about` | `src/pages/onboarding/intro/AboutPage.jsx` | What Sema is, part 1 of the intro. |
| How Sema works | `/how-it-works` | `src/pages/onboarding/intro/HowSemaWorksPage.jsx` | What Sema is, part 2 of the intro. |
| How Sema handles your data | `/privacy` | `src/pages/onboarding/intro/PrivacyPage.jsx` | What Sema is, part 3 of the intro. |
| Camera check | `/setup/camera` | `src/pages/onboarding/CameraCheckPage.jsx` | Setup's one page: finds the signing hand, the last step before Practice. |
| Learn | `/learn` | `src/pages/learn/LearnPage.jsx` | A placeholder for lessons (Phase 3.3). |
| Practice | `/practice` | `src/pages/practice/PracticePage.jsx` | Pick a letter, sign it, hold it 3 s; the classifier live. The main page for now. |

A new visitor opening Learn or Practice is sent to Welcome first; finishing setup (the camera
check) opens Practice. A returning visitor opening `/` goes straight to Practice. See
`docs/onboarding-pages.md` for the full flow and what each onboarding page says.

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

- A free-practice-by-letter mode already exists as Practice. Being planned: a word-spelling
  quiz page, inspired by fingerspelling.xyz, to sit alongside it (see the brainstorming
  conversation; no design doc yet as of 2026-10-24).
- Learn's lessons (Phase 3.3) are not built; `/learn` is still a placeholder.
