import { FORMAT_VERSION, sessionFileName } from './sessionFile.js'

// The session in progress is autosaved in this browser so a refresh doesn't
// lose it. Storage can be missing (private windows, blocked site data) or
// full, so every access is wrapped in try/catch and fails softly.
const SESSION_KEY = 'sema.recorder.session'
const USED_IDS_KEY = 'sema.recorder.sessionIds'

// Returns false if the browser refused to save (storage unavailable or full).
export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return true
  } catch {
    return false
  }
}

// The saved session, or null if there is none or it can't be used.
export function loadSession() {
  try {
    const text = localStorage.getItem(SESSION_KEY)
    if (!text) return null
    const session = JSON.parse(text)
    const usable =
      session?.format === FORMAT_VERSION &&
      Array.isArray(session.recordings) &&
      Array.isArray(session.samples)
    return usable ? session : null
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

export function loadUsedSessionIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(USED_IDS_KEY) ?? '[]')
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

export function rememberSessionId(id) {
  const ids = loadUsedSessionIds()
  if (ids.includes(id)) return
  try {
    localStorage.setItem(USED_IDS_KEY, JSON.stringify([...ids, id]))
  } catch {
    // Not remembering only affects the next suggested session ID.
  }
}

// Saves the session as a JSON file in the browser's downloads.
export function downloadSession(session) {
  const blob = new Blob([JSON.stringify(session)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = sessionFileName(session)
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
