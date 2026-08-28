import type { Selection, SpellingMode } from './types.js'
import { parseDegreeList, type ParsedDegree } from './intervals.js'
import { getChordType } from './chords.js'
import { getScaleType } from './scales.js'
import { spellNote } from './spelling.js'

export type SelectionInfo = {
  /** "E" + symbol for chords ("Em7b5"), root + scale name for scales. */
  title: string
  /** Root-prefixed alternate symbols; empty for scales. */
  aka: string[]
  /** Degree tokens, optional ones wrapped in parens, e.g. "(5)". */
  intervals: string[]
  /**
   * Successive semitone gaps over all tones. Scales close the circle back to
   * the octave (7 gaps for 7 notes); chords do not (2 gaps for a triad).
   */
  halfSteps: number[]
  /** Gaps over required tones only; equals halfSteps when nothing is optional. */
  halfStepsRequired: number[]
  /** Spelled notes, optional ones wrapped in parens, e.g. "(B)". */
  notes: string[]
}

const gaps = (ds: ParsedDegree[], closeOctave: boolean): number[] => {
  const steps = ds.slice(1).map((d, i) => d.semitones - ds[i]!.semitones)
  if (closeOctave && ds.length > 0) steps.push(12 - (ds[ds.length - 1]!.semitones % 12))
  return steps
}

export function getSelectionInfo(
  selection: Selection,
  spelling: SpellingMode = 'strict',
): SelectionInfo {
  const isChord = selection.mode === 'chord'
  const chord = isChord ? getChordType(selection.typeId) : null
  const type = chord ?? getScaleType(selection.typeId)
  const degrees = parseDegreeList(type.intervals)
  const required = degrees.filter(d => !d.optional)
  const wrap = (d: ParsedDegree, text: string) => (d.optional ? `(${text})` : text)
  return {
    title: chord ? `${selection.root}${chord.symbol}` : `${selection.root} ${type.name}`,
    aka: chord ? chord.aliases.map(a => `${selection.root}${a}`) : [],
    intervals: degrees.map(d => wrap(d, d.token)),
    halfSteps: gaps(degrees, !isChord),
    halfStepsRequired: gaps(required, !isChord),
    notes: degrees.map(d => wrap(d, spellNote(selection.root, d.token, spelling))),
  }
}
