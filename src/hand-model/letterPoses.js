import { useEffect, useState } from 'react'
import { normalizePose } from './pose.js'

// The 3D hand's pose for each letter, from public/languages/asl/letters/
// (A.json to Z.json, in Eidos's pose format, docs/hand-poses.md). A letter is
// available when its file is a valid pose. It's unavailable when its file is
// empty, {} or a placeholder ("available": false), quietly: that's a letter
// with no pose yet. A file with pose values that don't make a valid pose is
// unavailable too, with the reason in the console (Eidos's rule: a file it
// can't read is skipped).
// This module doesn't load three.js: only HandModelView does, and only once a
// letter has a pose to show.

// Fields only a pose has: a file with none of them hasn't been filled in yet.
const POSE_FIELDS = ['pinky', 'ring', 'middle', 'index', 'thumb', 'spread', 'rotate', 'wrist']

// What a file's text holds: a pose, or null for no pose (yet). Throws when it
// has pose values that don't make a valid pose.
export function readLetterPose(text) {
  if (text.trim() === '') return null
  const data = JSON.parse(text)
  if (data?.available === false) return null
  if (data && typeof data === 'object' && !POSE_FIELDS.some((field) => field in data)) return null
  return normalizePose(data)
}

// Each letter's file is fetched once per visit: letter → Promise of a pose or
// null. A failed request is forgotten, so the next visit to the letter tries
// again.
const poses = new Map()

export function loadLetterPose(letter) {
  if (!poses.has(letter)) poses.set(letter, fetchPose(letter))
  return poses.get(letter)
}

async function fetchPose(letter) {
  let response
  try {
    response = await fetch(`${import.meta.env.BASE_URL}languages/asl/letters/${letter}.json`)
    if (!response.ok) throw new Error(`${letter}.json: ${response.status}`)
  } catch (error) {
    console.warn(`No 3D hand for ${letter}: ${error.message}`)
    poses.delete(letter)
    return null
  }
  try {
    return readLetterPose(await response.text())
  } catch (error) {
    console.warn(`No 3D hand for ${letter}: ${letter}.json isn't a valid pose (${error.message})`)
    return null
  }
}

// Whether `letter` has a 3D hand, and its pose:
// { status: 'loading' | 'ready' | 'unavailable', letter, pose }.
// Moving to another letter keeps the last answer (with its own `letter`) until
// the new one arrives (a moment, or none once it's cached), so a 3D hand on
// screen isn't taken down and rebuilt between two letters that both have one.
export function useLetterPose(letter) {
  const [state, setState] = useState({ status: 'loading', letter: null, pose: null })
  useEffect(() => {
    let cancelled = false
    loadLetterPose(letter).then((pose) => {
      if (!cancelled) setState({ status: pose ? 'ready' : 'unavailable', letter, pose })
    })
    return () => {
      cancelled = true
    }
  }, [letter])
  return state
}
