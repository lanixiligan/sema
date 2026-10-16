import { LOADING_HAND_MODEL } from '../../vision/visionMessages.js'

// Whether a take can start, and what the top of the video says. A take needs
// the camera on, the hand model loaded, and the hand chosen for the take
// (takeHand) in view, whole, wrist included. The other hand never counts,
// even when it's whole. seenHand is the hand in view ('left', 'right' or
// null). The text is short: it's read at a glance while signing.
export function takeReadiness({ cameraStatus, modelStatus, seenHand, wholeHand, takeHand }) {
  if (cameraStatus === 'starting') return { ready: false, text: 'Starting camera…' }
  if (cameraStatus !== 'live') return { ready: false, text: 'Camera is off' }
  if (modelStatus !== 'ready') return { ready: false, text: LOADING_HAND_MODEL }
  if (!seenHand) return { ready: false, text: `Show your ${takeHand} hand` }
  if (seenHand !== takeHand) return { ready: false, text: `Switch to your ${takeHand} hand` }
  if (!wholeHand) return { ready: false, text: 'Show your whole hand and wrist' }
  return { ready: true, text: `${capitalize(takeHand)} hand ready` }
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
