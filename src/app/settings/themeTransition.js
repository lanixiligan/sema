import { flushSync } from 'react-dom'

// The effect when the theme switches: the new theme spreads outward from the
// day/night button as a growing circle, like a sunrise or sunset washing over
// the page.
//
// It uses the View Transitions API. `document.startViewTransition(change)`
// takes a picture of the page, runs `change` (which switches the theme), takes
// a second picture, and then plays an animation between the two. The two
// pictures become pseudo-elements the CSS can style:
// ::view-transition-old(root) and ::view-transition-new(root). styles.css grows
// the new one from a circle; this file only tells it where the circle starts
// (the button) and how big it must get (to the farthest corner), through three
// custom properties on <html>.

// The circle's radius that just covers the whole window when it starts at
// (x, y): the distance to the farthest corner.
export function revealRadius(x, y, width, height) {
  return Math.hypot(Math.max(x, width - x), Math.max(y, height - y))
}

// Runs `change` (the call that saves the new theme) with the reveal, starting
// from the middle of `button`. Browsers without the API (older Firefox and
// Safari) just change the theme at once, as before.
export function changeThemeWithReveal(change, button) {
  if (!document.startViewTransition) {
    change()
    return
  }

  const root = document.documentElement
  const box = button.getBoundingClientRect()
  const x = box.left + box.width / 2
  const y = box.top + box.height / 2
  root.style.setProperty('--theme-x', `${x}px`)
  root.style.setProperty('--theme-y', `${y}px`)
  root.style.setProperty('--theme-r', `${revealRadius(x, y, window.innerWidth, window.innerHeight)}px`)

  // While the pictures are taken, colours must not slide from the old value to
  // the new one on their own (buttons have colour transitions), or the new
  // picture would be caught half-way. This class turns those transitions off.
  root.classList.add('theme-switching')

  // flushSync makes React finish the switch (the render, and the effect in
  // App.jsx that sets data-theme) before the second picture is taken. That
  // effect also stores the shown theme, which the button's icon follows, and
  // React draws that second update a moment later, so the callback waits a
  // beat (returning a promise holds the picture back) to catch it too. It's a
  // timer, not requestAnimationFrame: the browser pauses drawing while it
  // waits for this callback, so an animation frame would never come.
  const transition = document.startViewTransition(async () => {
    flushSync(change)
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  transition.finished.finally(() => {
    root.classList.remove('theme-switching')
  })
}
