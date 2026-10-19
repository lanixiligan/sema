import { describe, expect, it } from 'vitest'
import { LOADING_HAND_MODEL } from '../../vision/model/visionMessages.js'
import { takeReadiness } from './takeReadiness.js'

// Everything ready: camera live, model loaded, the left hand whole in view.
const ready = { cameraStatus: 'live', modelStatus: 'ready', seenHand: 'left', wholeHand: true, takeHand: 'left' }

describe('takeReadiness', () => {
  it('is ready with the chosen hand whole in view', () => {
    expect(takeReadiness(ready)).toEqual({ ready: true, text: 'Left hand ready' })
  })

  it('waits for the camera and the hand model', () => {
    expect(takeReadiness({ ...ready, cameraStatus: 'starting' })).toEqual({ ready: false, text: 'Starting camera…' })
    expect(takeReadiness({ ...ready, cameraStatus: 'idle' })).toEqual({ ready: false, text: 'Camera is off' })
    expect(takeReadiness({ ...ready, modelStatus: 'loading' })).toEqual({ ready: false, text: LOADING_HAND_MODEL })
  })

  it('waits for a hand', () => {
    expect(takeReadiness({ ...ready, seenHand: null, wholeHand: false })).toEqual({
      ready: false,
      text: 'Show your left hand',
    })
  })

  it('refuses the other hand, even when it is whole', () => {
    expect(takeReadiness({ ...ready, seenHand: 'right' })).toEqual({
      ready: false,
      text: 'Switch to your left hand',
    })
  })

  it('needs the whole hand, wrist included', () => {
    expect(takeReadiness({ ...ready, wholeHand: false })).toEqual({
      ready: false,
      text: 'Show your whole hand and wrist',
    })
  })
})
