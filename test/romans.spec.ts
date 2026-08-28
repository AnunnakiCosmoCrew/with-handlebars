import { describe, expect, it } from 'vitest'
import { diatonicChords, type DiatonicChord, type ScaleSelection } from '../src/harmony.js'
import { harmonicFunction, romanNumeral } from '../src/romans.js'

const scale = (root: string, typeId: string): ScaleSelection => ({
  mode: 'scale',
  root,
  typeId,
})

const TRIAD_IDS = new Set(['major', 'minor', 'dim', 'aug'])
const SEVENTH_IDS = new Set(['7', 'maj7', 'm7', 'mmaj7', 'm7b5', 'dim7'])

const numerals = (s: ScaleSelection, ids: Set<string>): string[] =>
  diatonicChords(s)
    .filter(c => ids.has(c.typeId))
    .map(c => romanNumeral(c, s))

const find = (s: ScaleSelection, degreeIndex: number, typeId: string): DiatonicChord =>
  diatonicChords(s).find(c => c.degreeIndex === degreeIndex && c.typeId === typeId)!

describe('romanNumeral', () => {
  it('numbers the C major triads and sevenths', () => {
    const s = scale('C', 'major')
    expect(numerals(s, TRIAD_IDS)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
    expect(numerals(s, SEVENTH_IDS)).toEqual([
      'Imaj7',
      'ii7',
      'iii7',
      'IVmaj7',
      'V7',
      'vi7',
      'viiø7',
    ])
  })

  it('reads accidentals from the scale tokens in A harmonic minor', () => {
    // diatonicChords matches by pitch class, so enharmonic chords (F minor's
    // Ab = G#) appear too — the numerals must still be right for all of them.
    const s = scale('A', 'harmonic-minor')
    expect(diatonicChords(s).map(c => romanNumeral(c, s))).toEqual([
      'i',
      'imaj7',
      'ii°',
      'iiø7',
      'ii°7',
      'bIII+',
      'iv',
      'iv°',
      'iv7',
      'ivø7',
      'iv°7',
      'V',
      'V+',
      'V7',
      'bVI',
      'bvi',
      'bvi°',
      'bVImaj7',
      'bvimaj7',
      'bvi°7',
      'vii°',
      'VII+',
      'vii°7',
    ])
  })

  it('still numbers chords of non-heptatonic scales', () => {
    const s = scale('C', 'pentatonic-major')
    expect(diatonicChords(s).map(c => romanNumeral(c, s))).toEqual(['I', 'vi', 'vi7'])
  })
})

describe('harmonicFunction', () => {
  it('classifies the C major degrees', () => {
    const s = scale('C', 'major')
    expect(harmonicFunction(find(s, 1, 'major'), s)).toBe('tonic')
    expect(harmonicFunction(find(s, 2, 'minor'), s)).toBe('subdominant')
    expect(harmonicFunction(find(s, 3, 'minor'), s)).toBe('tonic')
    expect(harmonicFunction(find(s, 4, 'major'), s)).toBe('subdominant')
    expect(harmonicFunction(find(s, 5, 'major'), s)).toBe('dominant')
    expect(harmonicFunction(find(s, 6, 'minor'), s)).toBe('tonic')
    expect(harmonicFunction(find(s, 7, 'dim'), s)).toBe('dominant')
  })

  it('declines to classify non-heptatonic scales', () => {
    const s = scale('C', 'pentatonic-major')
    expect(harmonicFunction(find(s, 1, 'major'), s)).toBeNull()
  })
})
