# Onboarding pages

What a new visitor sees before Try (the main page for now), and what each page says. This describes the pages
as built on 2026-10-18 (since 2026-10-22, setup leads to Try instead of Record); the page files in `src/pages/onboarding/` are the source of truth,
so update this document when they change.

## The flow

| Order | Page | Address | File |
| --- | --- | --- | --- |
| 1 | Welcome | `/` | `WelcomePage.jsx` |
| 2 | About Sema | `/about` | `AboutPage.jsx` (+ `AboutPreview.jsx`) |
| 3 | How Sema works | `/how-it-works` | `HowSemaWorksPage.jsx` |
| 4 | How Sema handles your data | `/privacy` | `PrivacyPage.jsx` |
| 5 | Camera check (setup) | `/setup/camera` | `CameraCheckPage.jsx` |

- A **new visitor** starts on Welcome. Opening Try, Learn or Practice sends them back
  to Welcome (`resolveRoute` in `src/app/routing/router.js`).
- Finishing the camera check finishes setup. A **returning visitor** opening `/` goes
  straight to Try (to Record until 2026-10-22, then briefly Learn; Record is now a developer
  tool, `/dev/record`).
  The intro pages can still be opened by their address. Then About's
  Previous and the data page's Previous go back to wherever the person came from, and the
  data page has no Next.
- On a **small screen** (narrower than 900px), the phone notice replaces the whole app
  first (`src/app/layout/PhoneNotice.jsx`, below).
- **Delete Sema's data** (the gear menu on the main pages) makes the visitor new again.

## What every onboarding page shares

- The top bar: the logo (a link to Welcome), "Preview", and the theme toggle (Dark,
  Light, System). The pages follow the theme.
- **Previous** and **Next**, as quiet text along the bottom (`StepNav.jsx`), in the same
  place on every page and there from the start, so Next can be clicked page after page
  without moving the mouse. There is no Skip intro. Welcome has its own button instead.
- On the intro pages, the headline, then each section, fade in one after another
  (`useStaggeredReveal.js`). With reduced motion everything shows at once.
- None of these pages turns the camera on or downloads the hand model. The model starts
  downloading on the camera check.

## 1. Welcome (`/`)

One centred column under the top bar. The headline, the text and the button fade in one
after another on the first visit in a tab.

- Logo
- Headline: **Learn the ASL alphabet with your webcam.**
- Text: No account. Your video never leaves this device.
- Button: **Get started** (to About Sema)

## 2. About Sema (`/about`)

Two columns: the text on the left, a picture on the right. Previous: Welcome. Next: How
Sema works.

- Headline: **What is Sema?**
- Three sections, with a thin line between them (words in bold are highlighted on the page):
  1. "**Sema** is an interactive learning tool that helps you master the **American Sign
     Language (ASL) fingerspelling alphabet**." / "Practice forming each letter in front
     of your webcam and receive feedback on how closely your hand signs match the target."
  2. "**Fingerspelling** uses individual handshapes to represent letters, allowing you to
     spell names, words, and other terms that do not have their own signs."
  3. "Sema is still **under development.** For now, it can detect your hand through your
     webcam and guide you through the alphabet, one letter at a time."
- The picture (hidden from screen readers): a dark camera frame with a hand drawn as
  Sema draws it, labelled "Handshape preview", and under it the letter B: "Letter B /
  Flat hand, four fingers straight up and together, thumb folded across the palm."

## 3. How Sema works (`/how-it-works`)

The headline on one line, then three steps side by side, each with a number, a title,
an icon on the right, and its text. Previous: About Sema. Next: How Sema handles your data.

- Headline: **Three steps, one letter at a time.**

| Step | Title | Text |
| --- | --- | --- |
| 01 | Explore a letter | Each letter includes a reference image and a brief guide to its corresponding handshape. |
| 02 | Form the letter | Show your chosen hand to the camera. Sema tracks **21 landmarks** as you form the handshape. |
| 03 | Understand the handshape | Sema is being developed to recognize letters. For now, it can detect and track your hand. |

## 4. How Sema handles your data (`/privacy`)

Centred: a shield badge, the headline and the intro; under a thin line, three points side
by side; at the bottom, the hosting note. Previous: How Sema works. Next: the camera check.
Each claim was checked against the code (see the comment at the top of `PrivacyPage.jsx`).

- Headline: **Your hands stay yours.**
- Intro: "Sema processes your hand in real time, right in your browser. Your video is
  **never uploaded or recorded** by Sema."

| Point | Text |
| --- | --- |
| Your camera helps you practice | Sema tracks 21 points on your hand to follow its shape and movement. |
| You're in control of the camera | Sema uses your camera, never your microphone. Turn it off any time; it also turns off when you switch tabs or step away. |
| No account needed | Open Sema and start learning. Your settings stay on this computer. |

- Hosting note: "Like every website, Sema's host sees basic visit details, such as your
  internet address."

## 5. Camera check (`/setup/camera`)

Setup's one page. Two columns: three numbered steps on the left, the camera panel on the
right. Previous: How Sema handles your data. **Next stays closed until the check passes**,
then finishes setup and opens Try. Setup doesn't ask which hand the visitor signs
with: it saves Right.

- Headline: **Check your camera**
- Text: Let's make sure your camera is ready before you start.
- The steps, a checklist ticked off from what the camera and hand tracking really do:
  1. **Enable your camera**: Allow camera access when your browser asks, so Sema can see
     your hands.
  2. **Show both hands**: Hold both hands up with your wrists in view.
  3. **Hold still**: Keep both hands visible for three seconds.
- The camera panel: a header with a short status and, along its bottom edge, a line
  that fills over the three seconds; then the camera.

**The camera never starts by itself here.** The panel opens with "Camera is off" and "Turn
it on when you're ready. Sema only looks for your hands." The button says "Loading hand
model…" and waits until the model is ready, then **Turn camera on**; only that click makes
the browser ask for the camera.

**The status** in the panel's header, in order of priority:

| Status | When |
| --- | --- |
| Camera problem / Tracking problem | Something failed (the panel on the video explains) |
| Camera ready | The check passed |
| Camera off | Not on yet, or turned off |
| Starting… / Getting ready… | The camera or the hand model is starting |
| Hold still… 3, 2, 1 | Both hands whole in view, counting down |
| Waiting for both hands | No hand in view |
| Show other hand | One hand in view |
| Show wrists | Both hands in view, a wrist cut off |

**The rule** (`src/vision/landmarks/handChecks.js`): both hands up and whole (wrist in view) at the
same time for 3 seconds. With two hands, left and right come from where they are in the
picture, because MediaPipe's left/right label can flip while a hand turns. One hand alone
can never pass. A gap of more than 300 ms starts the 3 seconds again.

**When something goes wrong**, a panel on the video says what and offers Try again where
that can help:

| Title | Text |
| --- | --- |
| Camera access is blocked | Allow it from the camera icon in the address bar, then try again. |
| Your camera is busy | Another app may be using it, like a video call. Close it and try again. |
| No camera found | Check that a webcam is plugged in, then try again. |
| The camera stopped | It may have been unplugged or taken by another app. Try again when it's back. |
| The camera didn't start | (the browser's own explanation) |
| Hand tracking can't run in this browser | It needs WebGL, which this browser isn't giving to pages. Open Sema in Chrome or Firefox. |
| Hand tracking couldn't start | (the reason) |

**The camera turns itself off** when the visitor switches to another tab ("It turned off
when you switched to another tab."), or after a minute with no hand in view: a notice,
"No hand seen / The camera turns off in 50 s.", appears after 10 seconds and counts down,
then "It turned off because no hand was seen for a minute." It never comes back by itself.

## The phone notice

On a screen narrower than 900px, instead of the app:

- Headline: **Sema is made for computers, for now**
- Text: "It runs on phones, but the pages are designed for a laptop or desktop with a
  webcam. For the best experience, open this link on a computer."
- Buttons: **Copy link** (then "Link copied"), **Continue on this phone** (shows the app
  until the page is reloaded)
