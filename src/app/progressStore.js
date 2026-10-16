// Sema's settings, kept in this browser's localStorage so they survive a
// reload: the signing hand, whether setup is done, and the theme (theme.js).
// Pages never touch localStorage themselves; they go through this module, so
// per-letter progress (3.2) or accounts (Phase 5) can be added in one place.
import { DEFAULT_THEME, THEMES } from './theme.js'

const KEY = 'sema.progress'
const HANDS = ['left', 'right']

export const PROGRESS_VERSION = 1
export const NEW_VISITOR = { version: PROGRESS_VERSION, signingHand: null, setupDone: false, theme: DEFAULT_THEME }

// The saved settings, or NEW_VISITOR if there are none, they can't be read,
// or they're from another version. localStorage itself can throw (site data
// blocked), hence the try.
export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.version !== PROGRESS_VERSION) return NEW_VISITOR
    const signingHand = HANDS.includes(saved.signingHand) ? saved.signingHand : null
    // Setup can't be done without a signing hand. Settings saved before the
    // theme existed have none, so they get the default.
    return {
      version: PROGRESS_VERSION,
      signingHand,
      setupDone: saved.setupDone === true && signingHand !== null,
      theme: THEMES.includes(saved.theme) ? saved.theme : DEFAULT_THEME,
    }
  } catch {
    return NEW_VISITOR
  }
}

// Saves the settings. Returns false if the browser refused (storage full or
// blocked): the app keeps working, it just won't remember after a reload.
export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}
