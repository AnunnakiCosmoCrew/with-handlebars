import { Note } from 'tonal'
import type { SpellingMode } from './types.js'
import { getChordType } from './chords.js'
import { selectionDegrees } from './fretboard.js'
import { OVERLAY_CHORD_TYPE_IDS, type DiatonicChord, type ScaleSelection } from './harmony.js'
import { parseDegreeList } from './intervals.js'
import { romanNumeral } from './romans.js'
import { spellNote } from './spelling.js'

/**
 * The workhorse progressions of practice rooms everywhere, as 1-based scale
 * degrees. Case in the display name assumes a major key; the actual chord
 * qualities always come from harmonizing the current scale.
 */
export type ProgressionPreset = {
  id: string
  name: string
  degrees: number[]
}

export const PROGRESSION_PRESETS: ProgressionPreset[] = [
  { id: 'i-iv-v', name: 'I–IV–V', degrees: [1, 4, 5] },
  { id: 'ii-v-i', name: 'ii–V–I', degrees: [2, 5, 1] },
  { id: 'i-v-vi-iv', name: 'I–V–vi–IV', degrees: [1, 5, 6, 4] },
  { id: 'i-vi-iv-v', name: '’50s I–vi–IV–V', degrees: [1, 6, 4, 5] },
  { id: 'i-vi-ii-v', name: 'Turnaround I–vi–ii–V', degrees: [1, 6, 2, 5] },
  { id: 'pachelbel', name: 'Canon I–V–vi–iii–IV–I–IV–V', degrees: [1, 5, 6, 3, 4, 1, 4, 5] },
  // Meant for minor keys, where degrees 7 and 6 read bVII and bVI. Natural
  // minor harmonizes the last bar to v; the traditional major V shows up
  // when the scale supplies it (harmonic minor).
  { id: 'andalusian', name: 'Andalusian i–♭VII–♭VI–v', degrees: [1, 7, 6, 5] },
  { id: 'blues-12', name: '12-bar blues', degrees: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5] },
  {
    id: 'blues-minor-12',
    name: '12-bar minor blues',
    degrees: [1, 1, 1, 1, 4, 4, 1, 1, 6, 5, 1, 5],
  },
]

export type ProgressionStep = {
  /** 1-based scale degree the chord is built on. */
  degree: number
  /** Chord root spelled per the scale, e.g. "E#" in F# major. */
  root: string
  /**
   * Close voicing, ascending. Root position with the tonic anchored in
   * octave 3 — or, under `voiceLeading`, the inversion nearest the previous
   * step's voicing.
   */
  midi: number[]
  /** The curated overlay chord this stack forms, when it forms one. */
  chord: DiatonicChord | null
  /** Roman numeral (ASCII accidentals); bare accidental+base when no curated type matches. */
  numeral: string
}

/**
 * Harmonize a degree list against a scale by stacking scale tones in thirds
 * (every other scale step) on each degree — triads, or four-note sevenths
 * with `sevenths: true`. Defined for 7-note scales only, where "stacking in
 * thirds" means what it says; anything else throws.
 *
 * Each step names the stack it built: the matching curated overlay chord and
 * its roman numeral when the stack is one of the ten tertian types, or a
 * bare numeral (accidental + base, case by the stack's third) for the odd
 * stacks exotic heptatonic scales produce.
 *
 * With `voiceLeading: true`, every chord after the first is voiced as the
 * inversion (within an octave either way) that moves least from the previous
 * chord — how players actually connect changes — instead of jumping back to
 * root position. The chord identity, root, and numeral are unaffected.
 */
export function progressionSteps(
  scale: ScaleSelection,
  degrees: number[],
  opts: { sevenths?: boolean; spelling?: SpellingMode; voiceLeading?: boolean } = {},
): ProgressionStep[] {
  if (scale.mode !== 'scale') throw new Error('progressionSteps needs a scale selection')
  const tokens = selectionDegrees(scale)
  if (tokens.length !== 7) {
    throw new Error(`progressions need a 7-note scale; ${scale.typeId} has ${tokens.length}`)
  }
  const rootChroma = Note.chroma(scale.root)
  // tonal yields NaN (not undefined) for unparseable names — guard both.
  if (rootChroma === undefined || Number.isNaN(rootChroma)) {
    throw new Error(`bad root: ${scale.root}`)
  }
  const tonicMidi = 48 + rootChroma
  const stackSize = opts.sevenths ? 4 : 3

  let previous: number[] | null = null
  return degrees.map(degree => {
    if (!Number.isInteger(degree) || degree < 1 || degree > 7) {
      throw new Error(`bad scale degree: ${degree}`)
    }
    // Absolute semitone offsets from the tonic, stacked in scale thirds and
    // climbing monotonically (steps past the octave carry it up).
    const offsets = Array.from({ length: stackSize }, (_, k) => {
      const step = degree - 1 + 2 * k
      return tokens[step % 7]!.semitones + 12 * Math.floor(step / 7)
    })
    const relative = offsets.map(s => (s - offsets[0]! + 24) % 12)
    const root = spellNote(scale.root, tokens[degree - 1]!.token, opts.spelling ?? 'strict')
    const chord = matchOverlayType(relative, degree, root)
    const rootPosition = offsets.map(s => tonicMidi + s)
    const midi =
      opts.voiceLeading && previous ? closestVoicing(rootPosition, previous) : rootPosition
    previous = midi
    return {
      degree,
      root,
      midi,
      chord,
      numeral: chord ? romanNumeral(chord, scale) : bareNumeral(tokens[degree - 1]!.token, relative),
    }
  })
}

/**
 * The inversion of `rootPosition` (shifted up to an octave either way) whose
 * notes move least, in total semitones, from the previous voicing. Ties go
 * to the lower inversion; the register is kept playable by rejecting basses
 * outside E1–C5.
 */
function closestVoicing(rootPosition: number[], previous: number[]): number[] {
  let best = rootPosition
  // Explicit tie-break, not loop order: least movement, then the lower
  // inversion, then the smaller octave shift. Ties are real — symmetrical
  // stacks like diminished chords score their inversions identically.
  let bestRank: [number, number, number] | null = null
  for (let inversion = 0; inversion < rootPosition.length; inversion++) {
    const rotated = [
      ...rootPosition.slice(inversion),
      ...rootPosition.slice(0, inversion).map(m => m + 12),
    ]
    for (const shift of [-12, 0, 12]) {
      const candidate = rotated.map(m => m + shift)
      const bass = candidate[0]!
      if (bass < 28 || bass > 72) continue
      const score = candidate.reduce((sum, m, i) => sum + Math.abs(m - previous[i]!), 0)
      const rank: [number, number, number] = [score, inversion, Math.abs(shift)]
      if (
        bestRank === null ||
        rank[0] < bestRank[0] ||
        (rank[0] === bestRank[0] &&
          (rank[1] < bestRank[1] || (rank[1] === bestRank[1] && rank[2] < bestRank[2])))
      ) {
        bestRank = rank
        best = candidate
      }
    }
  }
  return best
}

/** The curated overlay chord whose interval set equals this stack's, if any. */
function matchOverlayType(
  relative: number[],
  degreeIndex: number,
  root: string,
): DiatonicChord | null {
  const want = [...new Set(relative)].sort((a, b) => a - b).join(',')
  for (const typeId of OVERLAY_CHORD_TYPE_IDS) {
    const type = getChordType(typeId)
    const have = [
      ...new Set(parseDegreeList(type.intervals).map(d => d.semitones % 12)),
    ]
      .sort((a, b) => a - b)
      .join(',')
    if (have === want) {
      return { degreeIndex, root, typeId, label: `${root}${type.symbol}` }
    }
  }
  return null
}

const ROMAN_BASES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

/** Accidental + base numeral, lowercase iff the stack's third is minor. */
function bareNumeral(token: string, relative: number[]): string {
  const acc = /^(#{1,2}|b{1,2})/.exec(token)?.[0] ?? ''
  const degree = Number(token.replace(/[#b]/g, ''))
  const base = ROMAN_BASES[(degree - 1) % 7]!
  return `${acc}${relative[1] === 3 ? base.toLowerCase() : base}`
}
