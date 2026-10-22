import { useEffect, useState } from 'react'

// The letter list lives in public/languages/asl/letters.json, so changing
// which letters are recorded doesn't need a code change. Entries marked
// pilotOnly are recorded in the pilot but left out of 2.2's first training set.
// A letter can carry "instructions" (how to form it, described for the right
// hand: a list of short steps, shown as bullets; one string counts as one
// step) and an "image": a reference picture's path inside public/ (the
// letters' drawings are images/asl/b.svg and so on).
export function splitLetters(entries) {
  const training = []
  const pilot = []
  const instructions = {}
  const images = {}
  for (const entry of entries ?? []) {
    const letter = entry?.letter
    if (typeof letter !== 'string' || !/^[A-Z]$/.test(letter)) continue
    if (training.includes(letter) || pilot.includes(letter)) continue
    ;(entry.pilotOnly ? pilot : training).push(letter)
    const steps = [entry.instructions].flat().filter((step) => typeof step === 'string' && step.trim() !== '')
    if (steps.length > 0) instructions[letter] = steps
    if (typeof entry.image === 'string') images[letter] = entry.image
  }
  return { training, pilot, instructions, images }
}

export function useLetters() {
  const [state, setState] = useState({ status: 'loading', training: [], pilot: [], instructions: {}, images: {} })

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}languages/asl/letters.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`letters.json: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', ...splitLetters(data.letters) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', training: [], pilot: [], instructions: {}, images: {} })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
