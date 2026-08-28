import { Note } from 'tonal'
import type { Tuning } from './types.js'
import { DEFAULT_FRET_COUNT } from './fretboard.js'

/**
 * Melodic practice patterns over an ascending note run — the classic scale
 * (and arpeggio) workout menu: straight runs, diatonic 3rds and 4ths, and
 * sliding groups of three or four. The run itself comes from the caller
 * (scale run, position box, chord arpeggio — anything ascending).
 */
export const SEQUENCE_PATTERN_IDS = [
  'asc',
  'desc',
  'updown',
  'thirds',
  'fourths',
  'groups3',
  'groups4',
] as const

export type SequencePatternId = (typeof SEQUENCE_PATTERN_IDS)[number]

/**
 * The order in which to play an ascending run of `count` notes, as indices
 * into that run:
 *
 * - `asc` / `desc`: the plain run, up or down.
 * - `updown`: up and back down without repeating the peak.
 * - `thirds` / `fourths`: skip patterns — each step pairs a note with the one
 *   two (or three) run-positions above it: 0,2, 1,3, 2,4…
 * - `groups3` / `groups4`: sliding windows — 0,1,2, 1,2,3, 2,3,4…
 *
 * A pattern that cannot form even one full group at this count (say, thirds
 * over two notes) falls back to the plain ascending run.
 */
export function sequenceIndices(count: number, pattern: SequencePatternId): number[] {
  if (!Number.isInteger(count) || count < 0) throw new Error(`bad count: ${count}`)
  const asc = Array.from({ length: count }, (_, i) => i)
  switch (pattern) {
    case 'asc':
      return asc
    case 'desc':
      return asc.slice().reverse()
    case 'updown':
      return count < 2 ? asc : asc.concat(asc.slice(0, -1).reverse())
    case 'thirds':
      return skips(count, 2) ?? asc
    case 'fourths':
      return skips(count, 3) ?? asc
    case 'groups3':
      return groups(count, 3) ?? asc
    case 'groups4':
      return groups(count, 4) ?? asc
    default:
      throw new Error(`bad pattern: ${pattern satisfies never}`)
  }
}

/** `sequenceIndices` applied to an actual ascending run of MIDI notes. */
export function sequenceNotes(midis: number[], pattern: SequencePatternId): number[] {
  return sequenceIndices(midis.length, pattern).map(i => midis[i]!)
}

function skips(count: number, skip: number): number[] | null {
  if (count <= skip) return null
  const out: number[] = []
  for (let i = 0; i + skip < count; i++) out.push(i, i + skip)
  return out
}

function groups(count: number, size: number): number[] | null {
  if (count < size) return null
  const out: number[] = []
  for (let i = 0; i + size <= count; i++) {
    for (let j = 0; j < size; j++) out.push(i + j)
  }
  return out
}

/**
 * Every place a pitch class sounds on the neck — the answer key for
 * find-the-note drills. Accepts any spelling ("G", "F##", "Abb"); positions
 * come back low string first, low fret first, with the sounding MIDI note.
 */
export function notePositions(
  tuning: Tuning,
  note: string,
  fretCount: number = DEFAULT_FRET_COUNT,
): { string: number; fret: number; midi: number }[] {
  const chroma = Note.chroma(note)
  // tonal yields NaN (not undefined) for unparseable names — guard both.
  if (chroma === undefined || Number.isNaN(chroma)) throw new Error(`bad note: ${note}`)
  const out: { string: number; fret: number; midi: number }[] = []
  tuning.strings.forEach((open, string) => {
    for (let fret = 0; fret <= fretCount; fret++) {
      if ((open + fret) % 12 === chroma) out.push({ string, fret, midi: open + fret })
    }
  })
  return out
}
