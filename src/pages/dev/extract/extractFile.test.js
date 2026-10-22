import { describe, expect, it } from 'vitest'
import { extractionFileName, newExtraction, parsePhotoPath, samplesFromDetection } from './extractFile.js'

// 21 points spread out like a hand, in MediaPipe's 0–1 fractions.
function points(offset = 0) {
  return Array.from({ length: 21 }, (_, i) => ({ x: 0.4 + offset + i * 0.01, y: 0.8 - i * 0.02, z: -0.001 * i }))
}

function detection(...hands) {
  return {
    landmarks: hands.map((h) => h.points),
    handedness: hands.map((h) => [{ categoryName: h.label, score: 0.98765 }]),
  }
}

const photo = { image: 'B/P10_B_1000.jpg', person: 'asl-hg-p10', letter: 'B', width: 300, height: 300 }

describe('parsePhotoPath', () => {
  it('reads the signer and the letter from the name', () => {
    expect(parsePhotoPath('asl-hg/B/P10_B_1000.jpg')).toEqual({
      dataset: 'asl-hg',
      image: 'B/P10_B_1000.jpg',
      person: 'asl-hg-p10',
      letter: 'B',
    })
  })

  it('pads one-digit signers so they sort in order', () => {
    expect(parsePhotoPath('asl-hg/C/P1_C_1.jpg').person).toBe('asl-hg-p01')
  })

  it('keeps digit labels', () => {
    expect(parsePhotoPath('asl-hg/6/P5_6_450.jpg').letter).toBe('6')
  })

  it('rejects a photo whose name does not match its folder', () => {
    expect(parsePhotoPath('asl-hg/B/P10_D_1000.jpg')).toBeNull()
  })

  it('rejects files that are not dataset photos', () => {
    expect(parsePhotoPath('asl-hg/LICENSE.txt')).toBeNull()
    expect(parsePhotoPath('asl-hg/B/notes.jpg')).toBeNull()
    expect(parsePhotoPath('P10_B_1000.jpg')).toBeNull()
  })

  it('reads ASLYset, whose letter folders are lowercase', () => {
    expect(parsePhotoPath('aslyset/images/User3/n/User3_N_30.png')).toEqual({
      dataset: 'aslyset',
      image: 'n/User3_N_30.png',
      person: 'aslyset-p03',
      letter: 'N',
    })
  })

  it("skips ASLYset's two-letter signs and its label files", () => {
    expect(parsePhotoPath('aslyset/images/User1/fn/User1_FN_1.png')).toBeNull()
    expect(parsePhotoPath('aslyset/labels/User1/a/User1_A_1.txt')).toBeNull()
  })

  it('rejects a folder that is not a known dataset', () => {
    expect(parsePhotoPath('public/B/P10_B_1000.jpg')).toBeNull()
    expect(parsePhotoPath('aslyset/B/P10_B_1000.jpg')).toBeNull()
  })
})

describe('samplesFromDetection', () => {
  it('gives no samples when no hand was found', () => {
    expect(samplesFromDetection(detection(), photo)).toEqual([])
  })

  it('gives one sample per hand, labelled from the photo', () => {
    const [sample] = samplesFromDetection(detection({ points: points(), label: 'Right' }), photo)
    expect(sample).toMatchObject({
      person: 'asl-hg-p10',
      language: 'asl',
      letter: 'B',
      detected: 'right',
      detectedScore: 0.99,
      image: 'B/P10_B_1000.jpg',
      handsFound: 1,
      width: 300,
      height: 300,
    })
    expect(sample.raw).toHaveLength(63)
    expect(sample.landmarks).toHaveLength(63)
    expect(sample.landmarks.slice(0, 3)).toEqual([0, 0, 0]) // the wrist is the origin
  })

  it('rounds like a session file', () => {
    const [sample] = samplesFromDetection(detection({ points: points(), label: 'Right' }), photo)
    for (const v of [...sample.raw, ...sample.landmarks]) expect(v).toBe(Math.round(v * 1e4) / 1e4)
  })

  it('flips a left hand to look like a right one', () => {
    const [right] = samplesFromDetection(detection({ points: points(), label: 'Right' }), photo)
    const [left] = samplesFromDetection(detection({ points: points(), label: 'Left' }), photo)
    expect(left.detected).toBe('left')
    expect(left.landmarks[3]).toBe(-right.landmarks[3])
    expect(left.landmarks[4]).toBe(right.landmarks[4])
  })

  it('marks every sample of a two-hand photo', () => {
    const samples = samplesFromDetection(
      detection({ points: points(), label: 'Right' }, { points: points(0.3), label: 'Left' }),
      photo,
    )
    expect(samples.map((s) => s.handsFound)).toEqual([2, 2])
  })

  it('drops a hand whose points are all in one spot', () => {
    const flat = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
    expect(samplesFromDetection(detection({ points: flat, label: 'Right' }), photo)).toEqual([])
  })
})

describe('the file', () => {
  it('starts empty and records how it was made', () => {
    const extraction = newExtraction({ dataset: 'asl-hg', browser: 'Chrome 155', delegate: 'GPU', date: '2026-10-22' })
    expect(extraction).toMatchObject({ kind: 'extracted', format: 1, normalization: 1, dataset: 'asl-hg' })
    expect(extraction.samples).toEqual([])
    expect(extractionFileName(extraction)).toBe('sema-extracted-asl-hg-2026-10-22.json')
  })
})
