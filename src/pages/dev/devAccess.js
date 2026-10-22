import devCode from './dev-code.json'

// The developer pages' access code: a keep-out sign, not a lock. Sema has no
// server, so the check happens here in the browser, and only the code's
// SHA-256 fingerprint ships in the app (dev-code.json, written by
// `npm run dev-code`), never the code itself. Someone who reads the JavaScript
// could still get past it, which is fine: nothing secret is behind it. A long
// passphrase keeps the code from being guessed from its fingerprint; a short
// PIN would be found in seconds by trying them all.

// null until a code is set.
export const DEV_CODE_HASH = devCode.sha256

// A code's SHA-256 fingerprint, as 64 hex characters. Spaces at either end
// don't count. (scripts/dev-code.js makes the same with Node's crypto.)
export async function hashCode(code) {
  const bytes = new TextEncoder().encode(code.trim())
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// True if the fingerprint saved in this browser (progressStore's devAccess)
// is the current code's, so setting a new code locks every browser out again.
export function isUnlocked(savedHash, codeHash = DEV_CODE_HASH) {
  return codeHash !== null && savedHash === codeHash
}
