import { useEffect, useState } from 'react'

// The letter list lives in public/languages/asl/letters.json, so changing
// which letters are recorded doesn't need a code change. Entries marked
// pilotOnly are recorded in the pilot but left out of 2.2's first training set.
// A letter can carry "instructions": how to form it, described for the right hand.
export function splitLetters(entries) {
  const training = []
  const pilot = []
  const instructions = {}
  for (const entry of entries ?? []) {
    const letter = entry?.letter
    if (typeof letter !== 'string' || !/^[A-Z]$/.test(letter)) continue
    if (training.includes(letter) || pilot.includes(letter)) continue
    ;(entry.pilotOnly ? pilot : training).push(letter)
    if (typeof entry.instructions === 'string') instructions[letter] = entry.instructions
  }
  return { training, pilot, instructions }
}

export function classLabel(letter) {
  return letter === 'none' ? 'No letter' : letter
}

export function useLetters() {
  const [state, setState] = useState({ status: 'loading', training: [], pilot: [], instructions: {} })

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
        if (!cancelled) setState({ status: 'error', training: [], pilot: [], instructions: {} })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
