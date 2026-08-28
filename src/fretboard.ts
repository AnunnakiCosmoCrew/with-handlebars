import type { FretDot, Selection, SpellingMode, Tuning } from './types.js'
import { parseDegreeList, type ParsedDegree } from './intervals.js'
import { getChordType } from './chords.js'
import { getScaleType } from './scales.js'
import { spellNote } from './spelling.js'
import { degreeRole } from './roles.js'
import { Note } from 'tonal'

export const DEFAULT_FRET_COUNT = 12

export function selectionDegrees(selection: Selection): ParsedDegree[] {
  const type =
    selection.mode === 'chord'
      ? getChordType(selection.typeId)
      : getScaleType(selection.typeId)
  return parseDegreeList(type.intervals)
}

/**
 * The core of the tool: every occurrence of the selection's tones across the
 * fretboard. For each string and fret, the sounding pitch class is matched
 * against the selection's degrees; a match yields a dot labeled by spelling
 * the ROOT up by the matched degree — which is what keeps F𝄪 from collapsing
 * to G in strict mode.
 */
/**
 * The selection's tones keyed by pitch class; first degree wins a chroma
 * collision. Optional tones are included — anything that can appear as a dot
 * counts.
 */
export function selectionChromaMap(selection: Selection): Map<number, ParsedDegree> {
  const rootChroma = Note.chroma(selection.root)
  if (rootChroma === undefined) throw new Error(`bad root: ${selection.root}`)
  const byChroma = new Map<number, ParsedDegree>()
  for (const d of selectionDegrees(selection)) {
    const chroma = (rootChroma + d.semitones) % 12
    if (!byChroma.has(chroma)) byChroma.set(chroma, d)
  }
  return byChroma
}

export function getFretboardDots(
  tuning: Tuning,
  selection: Selection,
  spelling: SpellingMode = 'strict',
  fretCount: number = DEFAULT_FRET_COUNT,
): FretDot[] {
  const byChroma = selectionChromaMap(selection)
  const dots: FretDot[] = []
  for (let s = 0; s < tuning.strings.length; s++) {
    const open = tuning.strings[s]!
    for (let fret = 0; fret <= fretCount; fret++) {
      const d = byChroma.get((open + fret) % 12)
      if (!d) continue
      dots.push({
        string: s,
        fret,
        midi: open + fret,
        note: spellNote(selection.root, d.token, spelling),
        degree: d.token,
        isRoot: d.degree === 1,
        isOptional: d.optional,
        role: degreeRole(d),
      })
    }
  }
  return dots
}
