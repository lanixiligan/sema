import { useEffect, useState } from 'react'
import { readLetterPose } from './letterPoses.js'
import { FINGERS, motionSteps, stillPose } from './pose.js'

// The letters' step-by-step guides, for the Handshapes page (2026-11-14,
// docs/hand-poses.md "Guides"). Every guide starts the same way, from the
// relaxed open hand: its pose is public/languages/asl/guides/Relaxed.json and
// its sentence guides/text/Relaxed.json (a list of one step). After that, a
// letter's guide is two things:
// - the hand at every later step: guides/B.json, an Eidos pose with `motion`.
//   Each motion step is one guide step, and the last is the finished
//   letter. The file's own pose (before `motion`) isn't used: Relaxed.json
//   takes its place, so every guide starts from the same hand.
// - the words for those steps: guides/text/B.json, written by hand, one entry
//   per motion step, in the same order (for now the counts may differ, see
//   readGuide):
//   [{ "say": "Fold {thumb} across your palm.", "checks": ["{thumb} folded across the palm"] }, …]
//   `say` is the step's sentence ({finger} names get a number badge, as in
//   Learn's checklist). `checks` are the finger conditions the step completes,
//   the exact texts from letterShapes.js; the tests check them against it, so
//   a guide can't quietly drift from the rules.
// Every letter has a guide file. Until Lanix makes its movement in Eidos, a
// letter's guide file is a copy of its finished pose (letters/B.json) with no
// `motion`: a still guide, shown as the finished letter alone, one step, with
// no Relaxed start (J and Z were copied without their movement too). Only the
// letters in guides/text/index.json have a text file (the browser can't list a
// folder, so it needs the list); the others have no sentences yet.
// This module doesn't load three.js.

// The fingers a sentence names in braces, each once: "{index} and {thumb}" →
// ['index', 'thumb'].
function fingersIn(say) {
  const names = [...say.matchAll(/\{(\w+)\}/g)].map((match) => match[1])
  return FINGERS.filter((finger) => names.includes(finger))
}

// A letter's guide, from the shared start (Relaxed.json's pose and its one
// text entry) and the letter's own guide pose and text, all already read:
// { whole, steps, stepByStep }. `whole` is the start with the guide's motion
// after it, the movement the 3D hand is fitted to. The motion decides how many
// steps there are; the text needn't match it (for now, while the guides are
// being made in Eidos): a step with no text entry has `say` null and the page
// shows only its number, and text entries past the last step are left out.
// Each step is { say, checks, fingers, duration, pose }: `duration` is how long
// the move to this step takes (ms; 0 for the first), `fingers` the ones the
// sentence names.
// A guide with no motion is still (`stepByStep` false): one step, its own
// pose, with no start and no text. Throws when a file can't be used at all.
export function readGuide(start, guide, texts = []) {
  if (!guide) throw new Error('the guide file has no pose')
  if (!Array.isArray(texts)) throw new Error('the text must be a list of steps')
  if (!guide.motion?.length) {
    const pose = stillPose(guide)
    return { whole: pose, steps: [{ say: null, checks: [], fingers: [], duration: 0, pose }], stepByStep: false }
  }
  if (!start?.pose) throw new Error('Relaxed.json has no pose')
  const whole = { ...stillPose(start.pose), motion: guide.motion }
  const allTexts = [...start.texts, ...texts]
  return {
    whole,
    stepByStep: true,
    steps: motionSteps(whole).map((step, i) => {
      const { say = null, checks = [] } = allTexts[i] ?? {}
      if (say !== null && (typeof say !== 'string' || say.trim() === '')) {
        throw new Error(`step ${i + 1}'s "say" must be a sentence`)
      }
      if (!Array.isArray(checks)) throw new Error(`step ${i + 1}'s "checks" must be a list`)
      return { say, checks, fingers: say ? fingersIn(say) : [], duration: step.duration, pose: step.pose }
    }),
  }
}

const folder = `${import.meta.env.BASE_URL}languages/asl/guides/`

// Fetches one of the guides' JSON files and reads it. Throws with the file's
// name and the reason.
async function fetchJson(path) {
  const response = await fetch(`${folder}${path}`)
  if (!response.ok) throw new Error(`guides/${path}: ${response.status}`)
  return response.json()
}

// Fetches one of the guides' pose files and reads it (null for an empty or
// placeholder file).
async function fetchPose(path) {
  const response = await fetch(`${folder}${path}`)
  if (!response.ok) throw new Error(`guides/${path}: ${response.status}`)
  return readLetterPose(await response.text())
}

// The step every guide starts with, fetched once per visit: Relaxed.json's
// pose and text/Relaxed.json's sentence, { pose, texts }, or null when either
// can't be read (then no letter has a guide). A failure is forgotten, so the
// next page that asks tries again.
let start = null

export function loadGuideStart() {
  if (!start) {
    start = Promise.all([fetchPose('Relaxed.json'), fetchJson('text/Relaxed.json')])
      .then(([pose, texts]) => {
        if (!pose) throw new Error('guides/Relaxed.json has no pose')
        if (!Array.isArray(texts) || texts.length !== 1) {
          throw new Error('guides/text/Relaxed.json must be a list of one step')
        }
        return { pose, texts }
      })
      .catch((error) => {
        console.warn(`No guides: ${error.message}`)
        start = null
        return null
      })
  }
  return start
}

// text/index.json, fetched once per visit: the letters that have a text file,
// the ones with written steps (Learn links only those to Handshapes). A
// failed request gives no guides and is forgotten, so the next page that asks
// tries again.
let letterList = null

export function loadGuideLetters() {
  if (!letterList) {
    letterList = fetchJson('text/index.json')
      .then((letters) => {
        if (!Array.isArray(letters)) throw new Error('guides/text/index.json must be a list of letters')
        return letters
      })
      .catch((error) => {
        console.warn(`No guides: ${error.message}`)
        letterList = null
        return []
      })
  }
  return letterList
}

// Each letter's guide, fetched once per visit: letter → Promise of
// { whole, steps, stepByStep } (readGuide), or null for one that can't be
// read (the reason goes to the console).
const guides = new Map()

export function loadLetterGuide(letter) {
  if (!guides.has(letter)) guides.set(letter, fetchGuide(letter))
  return guides.get(letter)
}

async function fetchGuide(letter) {
  const [withText, guideStart] = await Promise.all([loadGuideLetters(), loadGuideStart()])
  try {
    // The hand (guides/B.json) and, for a letter that has one, its words
    // (guides/text/B.json), together.
    const [guide, texts] = await Promise.all([
      fetchPose(`${letter}.json`),
      withText.includes(letter) ? fetchJson(`text/${letter}.json`) : [],
    ])
    return readGuide(guideStart, guide, texts)
  } catch (error) {
    console.warn(`No guide for ${letter}: ${error.message}`)
    return null
  }
}

// The letters with written steps, in text/index.json's order: null while it
// loads, then a list (empty when there are none).
export function useGuideLetters() {
  const [letters, setLetters] = useState(null)
  useEffect(() => {
    let cancelled = false
    loadGuideLetters().then((list) => {
      if (!cancelled) setLetters(list)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return letters
}

// A letter's guide: { status: 'loading' | 'ready' | 'unavailable', letter, guide }.
// As with useLetterPose, the last answer stays (with its own `letter`) until
// the new one arrives.
export function useLetterGuide(letter) {
  const [state, setState] = useState({ status: 'loading', letter: null, guide: null })
  useEffect(() => {
    if (!letter) return
    let cancelled = false
    loadLetterGuide(letter).then((guide) => {
      if (!cancelled) setState({ status: guide ? 'ready' : 'unavailable', letter, guide })
    })
    return () => {
      cancelled = true
    }
  }, [letter])
  return state
}
