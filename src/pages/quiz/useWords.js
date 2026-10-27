import { useEffect, useState } from 'react'
import { usableWords } from './quizRounds.js'

// The words a quiz can ask, from public/languages/asl/words.json, so the list
// changes without a code change. { status: 'loading' | 'ready' | 'error', list }
export function useWords() {
  const [state, setState] = useState({ status: 'loading', list: [] })
  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}languages/asl/words.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`words.json: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', list: usableWords(data.words) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', list: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])
  return state
}
