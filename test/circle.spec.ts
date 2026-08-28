import { describe, expect, it } from 'vitest'
import { CIRCLE_OF_FIFTHS, circlePosition, diatonicOnCircle } from '../src/circle.js'
import type { Selection } from '../src/types.js'
import type { ScaleSelection } from '../src/harmony.js'

const chord = (root: string, typeId: string): Selection => ({ mode: 'chord', root, typeId })
const scale = (root: string, typeId: string): ScaleSelection => ({ mode: 'scale', root, typeId })

describe('CIRCLE_OF_FIFTHS', () => {
  it('runs clockwise from C with flat-side spellings past the boundary', () => {
    expect(CIRCLE_OF_FIFTHS.map(k => k.major)).toEqual([
      'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F',
    ])
    expect(CIRCLE_OF_FIFTHS.map(k => k.minor)).toEqual([
      'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D',
    ])
  })

  it('carries the key signatures, sharps positive and flats negative', () => {
    expect(CIRCLE_OF_FIFTHS.map(k => k.sharps)).toEqual([
      0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1,
    ])
  })

  it('offers selectable enharmonic twins at the boundary keys only', () => {
    const alts = CIRCLE_OF_FIFTHS.map(k => k.majorAlt)
    expect(alts[6]).toBe('Gb')
    expect(alts[7]).toBe('C#')
    expect(alts.filter(Boolean)).toHaveLength(2) // Cb (index 5) is not selectable
    expect(CIRCLE_OF_FIFTHS[6]!.minorAlt).toBe('Eb')
    expect(CIRCLE_OF_FIFTHS[7]!.minorAlt).toBe('A#')
    expect(CIRCLE_OF_FIFTHS[0]!.majorAlt).toBeNull()
  })
})

describe('circlePosition', () => {
  it('puts major-quality selections on the outer ring', () => {
    expect(circlePosition(chord('C', 'major'))).toEqual({ index: 0, ring: 'major' })
    expect(circlePosition(chord('A', 'major'))).toEqual({ index: 3, ring: 'major' })
    expect(circlePosition(scale('C', 'major'))).toEqual({ index: 0, ring: 'major' })
    expect(circlePosition(scale('F#', 'lydian'))).toEqual({ index: 6, ring: 'major' })
  })

  it('puts minor-quality selections on the inner ring', () => {
    expect(circlePosition(chord('A', 'minor'))).toEqual({ index: 0, ring: 'minor' })
    expect(circlePosition(chord('A', 'm7'))).toEqual({ index: 0, ring: 'minor' })
    expect(circlePosition(scale('A', 'aeolian'))).toEqual({ index: 0, ring: 'minor' })
    expect(circlePosition(scale('E', 'dorian'))).toEqual({ index: 1, ring: 'minor' })
  })

  it('matches enharmonic roots by pitch class', () => {
    expect(circlePosition(chord('Db', 'major'))).toEqual({ index: 7, ring: 'major' })
    expect(circlePosition(chord('C#', 'major'))).toEqual({ index: 7, ring: 'major' })
    expect(circlePosition(chord('Eb', 'minor'))).toEqual({ index: 6, ring: 'minor' })
  })

  it('defaults thirdless selections to the major ring', () => {
    expect(circlePosition(chord('C', '5'))).toEqual({ index: 0, ring: 'major' })
  })
})

describe('diatonicOnCircle', () => {
  const litIndexes = (flags: { major: boolean; minor: boolean }[], ring: 'major' | 'minor') =>
    flags.flatMap((f, i) => (f[ring] ? [i] : []))

  it('lights the contiguous neighborhood of a major key', () => {
    const flags = diatonicOnCircle(scale('C', 'major'))
    // F, C, G on the outer ring; Dm, Am, Em under them on the inner ring
    expect(litIndexes(flags, 'major')).toEqual([0, 1, 11])
    expect(litIndexes(flags, 'minor')).toEqual([0, 1, 11])
  })

  it('transposes with the key', () => {
    const flags = diatonicOnCircle(scale('A', 'major'))
    // D, A, E majors at indexes 2, 3, 4
    expect(litIndexes(flags, 'major')).toEqual([2, 3, 4])
    expect(litIndexes(flags, 'minor')).toEqual([2, 3, 4])
  })

  it('lights the scattered triads of harmonic minor', () => {
    const flags = diatonicOnCircle(scale('A', 'harmonic-minor'))
    expect(litIndexes(flags, 'major')).toEqual([4, 11]) // E and F majors
    expect(litIndexes(flags, 'minor')).toEqual([0, 8, 11]) // Am, Fm, Dm
  })

  it('rejects chord selections', () => {
    expect(() =>
      diatonicOnCircle(chord('C', 'major') as unknown as ScaleSelection),
    ).toThrow(/scale selection/)
  })
})
