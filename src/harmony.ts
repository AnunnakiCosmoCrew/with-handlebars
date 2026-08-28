import { Note } from 'tonal'
import type { Selection, SpellingMode } from './types.js'
import { getChordType } from './chords.js'
import { selectionDegrees } from './fretboard.js'
import { parseDegreeList } from './intervals.js'
import { spellNote } from './spelling.js'

/**
 * Chord types offered as scale overlays: the tertian triads and sevenths.
 * Curated so a diatonic scale yields a menu of ~20 chords rather than
 * hundreds; none of these has optional tones, so membership is unambiguous.
 */
export const OVERLAY_CHORD_TYPE_IDS = [
  'major',
  'minor',
  'dim',
  'aug',
  '7',
  'maj7',
  'm7',
  'mmaj7',
  'm7b5',
  'dim7',
] as const

export type DiatonicChord = {
  /** 1-based index of the chord root within the scale's interval list. */
  degreeIndex: number
  /** Chord root spelled per the scale's spelling, e.g. "E#" for F# major's 7. */
  root: string
  typeId: string
  /** ASCII label, root + chord symbol, e.g. "F#m7". */
  label: string
}

/** A Selection narrowed to scale mode — the only kind diatonicChords accepts. */
export type ScaleSelection = Selection & { mode: 'scale' }

/**
 * The chords that live inside a scale: for each scale degree as a root, every
 * overlay chord type whose tones are all pitch classes of the scale.
 */
export function diatonicChords(
  scale: ScaleSelection,
  spelling: SpellingMode = 'strict',
): DiatonicChord[] {
  // Runtime guard for JS callers; TypeScript callers are stopped by the type.
  if (scale.mode !== 'scale') throw new Error('diatonicChords needs a scale selection')
  const rootChroma = Note.chroma(scale.root)
  if (rootChroma === undefined) throw new Error(`bad root: ${scale.root}`)
  const degrees = selectionDegrees(scale)
  const scaleChromas = new Set(degrees.map(d => (rootChroma + d.semitones) % 12))
  const seen = new Set<number>()
  const out: DiatonicChord[] = []
  degrees.forEach((d, i) => {
    const chroma = (rootChroma + d.semitones) % 12
    if (seen.has(chroma)) return
    seen.add(chroma)
    const root = spellNote(scale.root, d.token, spelling)
    for (const typeId of OVERLAY_CHORD_TYPE_IDS) {
      const type = getChordType(typeId)
      const tones = parseDegreeList(type.intervals)
      if (tones.every(t => scaleChromas.has((chroma + t.semitones) % 12))) {
        out.push({ degreeIndex: i + 1, root, typeId, label: `${root}${type.symbol}` })
      }
    }
  })
  return out
}
