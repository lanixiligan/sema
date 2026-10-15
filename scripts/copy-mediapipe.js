// Copies MediaPipe's WebAssembly files from node_modules into public/, so the
// app serves them itself instead of loading them from a CDN.
//
// Runs automatically after `npm install` ("postinstall" in package.json), or
// by hand with `npm run copy-mediapipe`.
//
// Why the version matters: the JavaScript we import from
// @mediapipe/tasks-vision and these .wasm/.js files are built together and
// call each other by internal names. Files from a different release can fail
// with confusing errors, so always copy them from the installed package.
import { cpSync, rmSync } from 'node:fs'

const from = 'node_modules/@mediapipe/tasks-vision/wasm'
const to = 'public/mediapipe/wasm'

rmSync(to, { recursive: true, force: true }) // drop files from an older version
cpSync(from, to, { recursive: true })
console.log(`Copied MediaPipe wasm files to ${to}`)
