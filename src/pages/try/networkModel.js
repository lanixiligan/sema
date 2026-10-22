import { NORMALIZATION_VERSION } from '../../vision/landmarks/normalizeHand.js'

// The small model from training/small.py, in the browser, for the Try
// page (/try). training/train_small.py saves it as public/models/asl-letters.json:
// the 63 numbers' mean and scale, then layers of weights. Logistic regression
// is one layer; the small neural network two. To judge a hand: scale its
// numbers, then for each layer, every output is its row of weights times the
// input, plus its bias, with negatives set to 0 between layers (ReLU). The
// last layer gives a score per letter, which softmax turns into percentages.
// Below the threshold, it's "not sure". This must give the same answers as
// small.py's forward(), or the page wouldn't show what training measured.

export function readModel(json) {
  if (json.kind !== 'network') throw new Error('This file is not a small (network) model.')
  if (json.normalization !== NORMALIZATION_VERSION) {
    throw new Error(`The model uses normalization ${json.normalization}; the app uses ${NORMALIZATION_VERSION}.`)
  }
  const { name, letters, threshold, mean, scale, layers } = json
  return { name, letters, threshold, mean, scale, layers }
}

// landmarks: a hand's 63 normalized numbers (normalizeHand.js).
// Returns { letter, confidence, sure, closest }: the top letter, its
// percentage (0 to 1), whether that reaches the threshold, and the three
// letters with the highest percentages, highest first.
export function classify(model, landmarks) {
  let values = landmarks.map((n, i) => (n - model.mean[i]) / model.scale[i])
  model.layers.forEach((layer, i) => {
    const isLast = i === model.layers.length - 1
    values = layer.weights.map((row, j) => {
      const sum = row.reduce((total, weight, k) => total + weight * values[k], layer.biases[j])
      return isLast ? sum : Math.max(0, sum)
    })
  })
  const percentages = softmax(values)

  const ranked = model.letters
    .map((letter, i) => ({ letter, confidence: percentages[i] }))
    .sort((a, b) => b.confidence - a.confidence)
  const top = ranked[0]
  return { letter: top.letter, confidence: top.confidence, sure: top.confidence >= model.threshold, closest: ranked.slice(0, 3) }
}

// e to each score, over their sum: percentages that add up to 1. Taking the
// top score away first gives the same result, and keeps e^score from
// overflowing.
function softmax(scores) {
  const top = Math.max(...scores)
  const powers = scores.map((score) => Math.exp(score - top))
  const total = powers.reduce((sum, p) => sum + p, 0)
  return powers.map((p) => p / total)
}
