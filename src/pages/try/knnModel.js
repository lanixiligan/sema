import { NORMALIZATION_VERSION } from '../../vision/landmarks/normalizeHand.js'

// The k-nearest-neighbours classifier from training/knn.py, in the browser,
// for the Try page (/try), under npm run dev only. training/train.py saves the model as
// data/models/knn-asl.json: every training hand's 63 numbers (one flat list),
// each one's letter, k, and the "not sure" threshold. To judge a hand: find
// the k training hands most like it and take the letter most of them have;
// if they're further than the threshold, it's "not sure". This must give the
// same answers as knn.py, or the page wouldn't show what training measured.

const NUMBERS = 63

// The parsed JSON as typed arrays, which are compact and fast to loop over.
export function readModel(json) {
  if (json.kind !== 'knn') throw new Error('This file is not a k-NN model.')
  if (json.normalization !== NORMALIZATION_VERSION) {
    throw new Error(`The model uses normalization ${json.normalization}; the app uses ${NORMALIZATION_VERSION}.`)
  }
  return {
    letters: json.letters,
    k: json.k,
    threshold: json.threshold,
    labels: Uint8Array.from(json.labels),
    shapes: Float32Array.from(json.shapes),
    count: json.labels.length,
  }
}

// landmarks: a hand's 63 normalized numbers (normalizeHand.js).
// Returns { letter, distance, sure, closest }: the letter, the average
// distance to the k neighbours, whether that's within the threshold, and the
// three closest letters (each by its closest training hand), nearest first.
export function classify(model, landmarks) {
  const { shapes, labels, count, k, letters } = model
  // The k nearest so far, nearest first, as { squared, label }. Squared
  // distances keep the same order and skip a square root per training hand.
  const nearest = []
  const closestPerLetter = new Array(letters.length).fill(Infinity)
  for (let i = 0; i < count; i++) {
    let squared = 0
    for (let j = 0; j < NUMBERS; j++) {
      const difference = shapes[i * NUMBERS + j] - landmarks[j]
      squared += difference * difference
    }
    const label = labels[i]
    if (squared < closestPerLetter[label]) closestPerLetter[label] = squared
    if (nearest.length < k || squared < nearest[nearest.length - 1].squared) {
      // Insert in order; equal distances keep the earlier training hand
      // first, like scikit-learn's search.
      let at = nearest.length
      while (at > 0 && nearest[at - 1].squared > squared) at -= 1
      nearest.splice(at, 0, { squared, label })
      if (nearest.length > k) nearest.pop()
    }
  }

  const distance = nearest.reduce((sum, n) => sum + Math.sqrt(n.squared), 0) / nearest.length
  const closest = letters
    .map((letter, label) => ({ letter, distance: Math.sqrt(closestPerLetter[label]) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
  return {
    letter: letters[vote(nearest.map((n) => n.label))],
    distance,
    sure: distance <= model.threshold,
    closest,
  }
}

// The label most neighbours have. They come nearest first, and among equal
// counts the one seen first wins, so a tie goes to the nearest's label
// (the same rule as knn.py's vote).
export function vote(labels) {
  const counts = new Map()
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1)
  let best = null
  for (const [label, count] of counts) if (best === null || count > counts.get(best)) best = label
  return best
}
