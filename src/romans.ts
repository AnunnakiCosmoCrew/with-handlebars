import type { DiatonicChord, ScaleSelection } from './harmony.js'
import { getChordType } from './chords.js'
import { selectionDegrees } from './fretboard.js'
import { parseDegreeList } from './intervals.js'

export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant'

const ROMAN_BASES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

/**
 * Quality suffixes for the overlay chord types. Triads whose quality the
 * case already carries get none; sevenths keep their symbol. Ids outside
 * this map fall back to the chord type's own symbol.
 */
const ROMAN_SUFFIXES: Record<string, string> = {
  major: '',
  minor: '',
  dim: '°',
  aug: '+',
  '7': '7',
  maj7: 'maj7',
  m7: '7',
  mmaj7: 'maj7',
  m7b5: 'ø7',
  dim7: '°7',
}

/** Degree class folded into one octave: "b13" → 6, "#11" → 4. */
const degreeClass = (degree: number): number => ((degree - 1) % 7) + 1

/**
 * Roman numeral of a diatonic chord within its scale. The numeral and its
 * accidental come straight from the scale's degree token — the alteration is
 * read against the major scale, so natural minor yields i ii° ♭III iv v ♭VI
 * ♭VII. Case follows the chord's third: lowercase iff it has a minor third.
 * Accidentals are ASCII ("bIII"); format with formatDegree for display.
 */
export function romanNumeral(chord: DiatonicChord, scale: ScaleSelection): string {
  const token = scaleToken(chord, scale)
  const acc = /^(#{1,2}|b{1,2})/.exec(token.token)?.[0] ?? ''
  const base = ROMAN_BASES[degreeClass(token.degree) - 1]!
  const type = getChordType(chord.typeId)
  const third = parseDegreeList(type.intervals).find(d => degreeClass(d.degree) === 3)
  const minor = third !== undefined && third.semitones % 12 === 3
  const suffix = ROMAN_SUFFIXES[chord.typeId] ?? type.symbol
  return `${acc}${minor ? base.toLowerCase() : base}${suffix}`
}

/**
 * Classic harmonic function by root degree class — defined only for 7-note
 * scales, where the categories mean what they say: 1/3/6 share the tonic
 * triad's tones, 2/4 share the subdominant's, and 5/7 carry the dominant's
 * tritone pull. Any other scale size returns null.
 */
export function harmonicFunction(
  chord: DiatonicChord,
  scale: ScaleSelection,
): HarmonicFunction | null {
  if (selectionDegrees(scale).length !== 7) return null
  const n = degreeClass(scaleToken(chord, scale).degree)
  if (n === 1 || n === 3 || n === 6) return 'tonic'
  if (n === 2 || n === 4) return 'subdominant'
  return 'dominant'
}

function scaleToken(chord: DiatonicChord, scale: ScaleSelection) {
  const degrees = selectionDegrees(scale)
  const token = degrees[chord.degreeIndex - 1]
  if (!token) throw new Error(`degree index ${chord.degreeIndex} outside ${scale.typeId}`)
  return token
}
