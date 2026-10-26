import { describe, expect, it } from 'vitest'
import { identifyChords, identifyFromPositions } from '../src/identify.js'
import { STANDARD_TUNING, getTuning } from '../src/tunings.js'
import type { FretPosition } from '../src/identify.js'

/** Fret per string, low to high; null = muted. */
const shape = (frets: (number | null)[]): FretPosition[] =>
  frets.flatMap((fret, string) => (fret === null ? [] : [{ string, fret }]))

describe('identifyFromPositions — standard tuning', () => {
  const cases: [string, (number | null)[], string, string][] = [
    ['open E', [0, 2, 2, 1, 0, 0], 'E', 'major'],
    ['open A', [null, 0, 2, 2, 2, 0], 'A', 'major'],
    ['open D', [null, null, 0, 2, 3, 2], 'D', 'major'],
    ['open G', [3, 2, 0, 0, 0, 3], 'G', 'major'],
    ['open C', [null, 3, 2, 0, 1, 0], 'C', 'major'],
    ['open Am', [null, 0, 2, 2, 1, 0], 'A', 'minor'],
    ['open Em', [0, 2, 2, 0, 0, 0], 'E', 'minor'],
    ['A7', [null, 0, 2, 0, 2, 0], 'A', '7'],
    ['Asus2', [null, 0, 2, 2, 0, 0], 'A', 'sus2'],
    ['Dsus4', [null, null, 0, 2, 3, 3], 'D', 'sus4'],
  ]
  it.each(cases)('%s ranks first', (_label, frets, root, typeId) => {
    const [top] = identifyFromPositions(STANDARD_TUNING, shape(frets))
    expect(top).toMatchObject({ root, chordTypeId: typeId, inversion: false })
  })

  it('reports power chords', () => {
    const [top] = identifyFromPositions(STANDARD_TUNING, shape([null, 3, 5, 5, null, null]))
    expect(top).toMatchObject({ root: 'C', chordTypeId: '5', name: 'C5' })
  })

  it('reports a slash bass and flags the inversion', () => {
    const [top] = identifyFromPositions(STANDARD_TUNING, shape([0, 3, 2, 0, 1, 0]))
    expect(top).toMatchObject({ root: 'C', chordTypeId: 'major', bass: 'E', inversion: true, name: 'C/E' })
  })

  it('names Am/C', () => {
    const [top] = identifyFromPositions(STANDARD_TUNING, shape([null, 3, 2, 2, 1, 0]))
    expect(top).toMatchObject({ name: 'Am/C', inversion: true })
  })

  it('treats the same pitch on two strings as one pitch class', () => {
    const once = identifyFromPositions(STANDARD_TUNING, shape([0, 2, 2, 1, 0, 0]))
    const doubled = identifyFromPositions(STANDARD_TUNING, [
      ...shape([0, 2, 2, 1, 0, 0]),
      { string: 5, fret: 0 },
      { string: 4, fret: 5 },
    ])
    expect(doubled).toEqual(once)
  })

  it('throws on a string outside the tuning', () => {
    expect(() => identifyFromPositions(STANDARD_TUNING, [{ string: 6, fret: 0 }])).toThrow(RangeError)
  })
})

describe('identifyFromPositions — other tunings', () => {
  it('reads open strings in Open G as G major', () => {
    const open = shape([0, 0, 0, 0, 0, 0])
    const [top] = identifyFromPositions(getTuning('open-g'), open)
    expect(top).toMatchObject({ root: 'G', chordTypeId: 'major', bass: 'D', inversion: true })
  })

  it('reads open strings in Open D5 as a D power chord', () => {
    const [top] = identifyFromPositions(getTuning('open-d5'), shape([0, 0, 0, 0, 0, 0]))
    expect(top).toMatchObject({ root: 'D', chordTypeId: '5' })
  })
})

describe('identifyChords — symmetric chords', () => {
  it('dim7 yields all four roots in a stable order, bass root first', () => {
    const names = identifyChords({ midi: [48, 51, 54, 57] }).map(x => x.name)
    expect(names).toEqual(['Cdim7', 'D#dim7/C', 'F#dim7/C', 'Adim7/C'])
  })

  it('dim7 from any bass yields the same four roots', () => {
    const roots = (midi: number[]) =>
      identifyChords({ midi })
        .filter(x => x.chordTypeId === 'dim7')
        .map(x => x.root)
        .sort()
    expect(roots([57, 60, 63, 66])).toEqual(roots([48, 51, 54, 57]))
  })

  it('augmented yields all three roots', () => {
    const c = identifyChords({ midi: [60, 64, 68] }).filter(x => x.chordTypeId === 'aug')
    expect(c).toHaveLength(3)
    expect(c[0]).toMatchObject({ root: 'C', inversion: false })
  })
})

describe('identifyChords — spelling and tie-break', () => {
  const cases: [string, number[], string, 'sharp' | 'flat' | undefined][] = [
    ['Db major by default', [49, 53, 56], 'Db', undefined],
    ['Gb major by default (equal accidentals favour flats)', [54, 58, 61], 'Gb', undefined],
    ['C# when forced sharp', [49, 53, 56], 'C#', 'sharp'],
    ['F# when forced sharp', [54, 58, 61], 'F#', 'sharp'],
  ]
  it.each(cases)('%s', (_label, midi, root, accidentals) => {
    expect(identifyChords({ midi }, accidentals ? { accidentals } : {})[0]!.root).toBe(root)
  })

  it('returns the same exact list on every call', () => {
    const names = () => identifyChords({ midi: [49, 53, 56, 60] }).map(x => x.name)
    expect(names()).toEqual(['Dbmaj7'])
    expect(names()).toEqual(['Dbmaj7'])
  })
})

describe('identifyChords — optional and missing tones', () => {
  it('accepts a dominant 9th without its fifth', () => {
    const c = identifyChords({ midi: [48, 52, 58, 62] })
    expect(c.some(x => x.root === 'C' && x.chordTypeId === '9')).toBe(true)
  })

  it('rejects a candidate missing a required tone', () => {
    // C E A is Am/C, never C6 (needs G).
    const c = identifyChords({ midi: [48, 52, 57] })
    expect(c.some(x => x.chordTypeId === '6')).toBe(false)
  })

  it('ranks fewer missing optional tones higher at equal bass treatment', () => {
    const c = identifyChords({ pitchClasses: [0, 4, 7, 10, 2] })
    expect(c[0]).toMatchObject({ root: 'C', chordTypeId: '9' })
  })
})

describe('identifyChords — degenerate input', () => {
  it.each([
    ['empty', { midi: [] }],
    ['a single note', { midi: [60] }],
    ['an octave', { midi: [48, 60, 72] }],
    ['empty pitch classes', { pitchClasses: [] }],
    ['one repeated pitch class', { pitchClasses: [2, 2, 14] }],
  ])('%s returns an empty list', (_label, input) => {
    expect(identifyChords(input)).toEqual([])
  })

  it('returns an empty list for notes no chord fits', () => {
    expect(identifyChords({ pitchClasses: [0, 1, 2, 3, 4, 5, 6] })).toEqual([])
  })

  it('identifyFromPositions of nothing is empty', () => {
    expect(identifyFromPositions(STANDARD_TUNING, [])).toEqual([])
  })
})

describe('identifyChords — pitch-class input', () => {
  it('takes the first pitch class as the bass', () => {
    expect(identifyChords({ pitchClasses: [4, 7, 0] })[0]).toMatchObject({ name: 'C/E' })
    expect(identifyChords({ pitchClasses: [0, 4, 7] })[0]).toMatchObject({ name: 'C' })
  })

  it('reduces out-of-range values mod 12', () => {
    expect(identifyChords({ pitchClasses: [12, 16, 19] })[0]).toMatchObject({ name: 'C' })
    expect(identifyChords({ pitchClasses: [-12, -8, -5] })[0]).toMatchObject({ name: 'C' })
  })

  it('ranks the root-position reading above the inversion', () => {
    // C E G A is C6 with the root in the bass and Am7/C otherwise.
    const [top] = identifyChords({ pitchClasses: [0, 4, 7, 9] })
    expect(top).toMatchObject({ name: 'C6', inversion: false })
  })

  it('honors limit', () => {
    expect(identifyChords({ midi: [48, 51, 54, 57] }, { limit: 2 })).toHaveLength(2)
    expect(identifyChords({ midi: [48, 51, 54, 57] }, { limit: 0 })).toEqual([])
  })
})
