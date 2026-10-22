import { NORMALIZATION_VERSION } from '../../../vision/landmarks/normalizeHand.js'
import { listHands } from '../../../vision/tracking/pickHand.js'
import { frameFromDetection } from '../../../recorder/takeRules.js'

// Builds the extracted file described in docs/data-format.md ("Extracted
// files"): the hand points found in a public dataset's photos, with samples
// laid out like a recorded session's, so training reads both the same way.
export const EXTRACT_FORMAT = 1

const round = (value, decimals) => Math.round(value * 10 ** decimals) / 10 ** decimals

// The datasets this tool reads, by their folder in data/public/ (the folder
// the person picks). Each keeps its photos in one folder per label, named
// with the signer's number and the label; `name` matches a photo's file name
// and captures both. Labels are one character, so ASLYset's two extra signs
// (FN, SP) are skipped like any other file.
export const DATASETS = {
  // ASL-HG: asl-hg/B/P10_B_1000.jpg (signers P1–P10, labels A–Z and 0–9).
  'asl-hg': { name: /^P(\d+)_([A-Z0-9])_\d+\.jpg$/i },
  // ASLYset: aslyset/images/User1/a/User1_A_1.png (signers User1–User4,
  // labels A–Y without J). Its labels/ folder holds boxes, not photos.
  aslyset: { name: /^User(\d+)_([A-Z0-9])_\d+\.png$/i },
}

// A path from the folder picker, like "asl-hg/B/P10_B_1000.jpg", gives
// { dataset: 'asl-hg', image: 'B/P10_B_1000.jpg', person: 'asl-hg-p10',
// letter: 'B' }. A file outside the known datasets, or a photo whose name
// doesn't match its folder, gives null.
export function parsePhotoPath(path) {
  const parts = path.split('/')
  const dataset = parts[0]
  if (parts.length < 3 || !Object.hasOwn(DATASETS, dataset)) return null
  const [folder, name] = parts.slice(-2)
  const match = DATASETS[dataset].name.exec(name)
  if (!match || match[2].toUpperCase() !== folder.toUpperCase()) return null
  return {
    dataset,
    image: `${folder}/${name}`,
    // Prefixed with the dataset, so ASL-HG's P10 can never be mistaken for
    // Sema's own p10, nor ASLYset's User1 for ASL-HG's P1.
    person: `${dataset}-p${match[1].padStart(2, '0')}`,
    letter: match[2].toUpperCase(),
  }
}

export function newExtraction({ dataset, browser, delegate, date }) {
  return {
    kind: 'extracted',
    format: EXTRACT_FORMAT,
    normalization: NORMALIZATION_VERSION,
    language: 'asl',
    dataset,
    browser,
    delegate,
    date,
    photos: 0,
    complete: false,
    misses: [],
    samples: [],
  }
}

// One photo's detection (a HandLandmarker result) as samples, one per hand
// found. Each hand goes through the recorder's own frameFromDetection
// (handedness, the left-hand flip, normalizeHand), then is rounded as in a
// session file. An empty list means no usable hand.
// photo: parsePhotoPath's result plus the photo's width and height.
export function samplesFromDetection(result, photo) {
  const hands = listHands(result)
  return hands
    .map((hand) => frameFromDetection({ ...hand, width: photo.width, height: photo.height }, null))
    .filter((frame) => frame.hasHand)
    .map((frame) => ({
      person: photo.person,
      language: 'asl',
      letter: photo.letter,
      detected: frame.detected,
      detectedScore: round(frame.detectedScore, 2),
      image: photo.image,
      handsFound: hands.length,
      width: frame.width,
      height: frame.height,
      raw: frame.raw.map((v) => round(v, 4)),
      landmarks: frame.landmarks.map((v) => round(v, 4)),
    }))
}

export function extractionFileName(extraction) {
  return `sema-extracted-${extraction.dataset}-${extraction.date}.json`
}
