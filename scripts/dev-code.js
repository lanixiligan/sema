// Sets the access code for the developer pages (/dev): saves its SHA-256
// fingerprint in src/pages/dev/dev-code.json, never the code itself.
// Usage: npm run dev-code -- "a long passphrase"
// Then commit dev-code.json and deploy. Every browser needs the new code.
// See src/pages/dev/devAccess.js for why this is a keep-out sign, not a lock.
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const FILE = new URL('../src/pages/dev/dev-code.json', import.meta.url)
// The fingerprint ships in the app, so a short code could be found by trying
// every possibility; a passphrase this long can't be in practice.
export const MIN_LENGTH = 12

// The same as devAccess.js's hashCode: spaces at either end don't count.
export function fingerprint(code) {
  return createHash('sha256').update(code.trim(), 'utf8').digest('hex')
}

function main(code) {
  if (!code || code.trim().length < MIN_LENGTH) {
    console.error(`Usage: npm run dev-code -- "a passphrase of at least ${MIN_LENGTH} characters"`)
    console.error('A few unrelated words make a good one, e.g. "violet kettle harbour seven".')
    process.exit(2)
  }
  writeFileSync(FILE, JSON.stringify({ sha256: fingerprint(code) }, null, 2) + '\n')
  console.log('Saved the fingerprint in src/pages/dev/dev-code.json. Commit it and deploy.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv[2])
}
