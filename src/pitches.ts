import { Note } from 'tonal'
import type { Selection, SpellingMode, Tuning } from './types.js'
import { DEFAULT_FRET_COUNT, getFretboardDots, selectionDegrees } from './fretboard.js'
import { spellNote } from './spelling.js'

/**
 * An exact (octave-aware) pitch with its theoretical spelling. The octave
 * pairs with the SPELLING in scientific pitch notation, not with the raw
 * MIDI octave: B#3 sounds midi 60 (same as C4), Cb4 sounds midi 59.
 */
export type SpelledPitch = {
  /** Sounding MIDI note. */
  midi: number
  /** Spelled pitch class, ASCII accidentals ("F##", "Ab"). */
  name: string
  /** The bare letter, "A"–"G". */
  letter: string
  /** Accidental suffix of `name`: "", "#", "##", "b", or "bb". */
  accidental: string
  /** Octave that makes `name` + octave sound at `midi`. */
  octave: number
}

export type SelectionPitch = SpelledPitch & {
  isRoot: boolean
  /** Every place this exact pitch lives on the neck, low string first. */
  positions: { string: number; fret: number }[]
}

export type IdentifiedPitch = SpelledPitch & {
  /** Whether the pitch class belongs to the current selection. */
  inSelection: boolean
}

/** Simple sharp names for pitches outside the selection's spelled tones. */
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function spelledPitch(midi: number, name: string): SpelledPitch {
  // Start from the sounding octave, then correct for wrap-around spellings
  // (B# belongs an octave below its sound, Cb an octave above).
  let octave = Math.floor(midi / 12) - 1
  const at = (o: number) => Note.midi(`${name}${o}`)
  if (at(octave) !== midi) octave += (at(octave) ?? midi) > midi ? -1 : 1
  if (at(octave) !== midi) throw new Error(`cannot place ${name} at midi ${midi}`)
  return { midi, name, letter: name[0]!, accidental: name.slice(1), octave }
}

/**
 * Every distinct exact pitch of the selection present on the neck, ascending,
 * each with all the positions where it sounds. This is the staff view's data:
 * the neck's pitch inventory for the selection.
 */
export function selectionPitches(
  tuning: Tuning,
  selection: Selection,
  spelling: SpellingMode = 'strict',
  fretCount: number = DEFAULT_FRET_COUNT,
): SelectionPitch[] {
  const byMidi = new Map<number, SelectionPitch>()
  for (const dot of getFretboardDots(tuning, selection, spelling, fretCount)) {
    let p = byMidi.get(dot.midi)
    if (!p) {
      p = { ...spelledPitch(dot.midi, dot.note), isRoot: dot.isRoot, positions: [] }
      byMidi.set(dot.midi, p)
    }
    p.positions.push({ string: dot.string, fret: dot.fret })
  }
  return [...byMidi.values()].sort((a, b) => a.midi - b.midi)
}

/**
 * Identify an arbitrary string/fret position. If its pitch class belongs to
 * the selection, the selection's spelling is used (so the 7th of C# major
 * comes back as B#, not C); otherwise simple sharp spelling.
 */
export function identifyPosition(
  tuning: Tuning,
  stringIndex: number,
  fret: number,
  selection?: Selection,
  spelling: SpellingMode = 'strict',
): IdentifiedPitch {
  const open = tuning.strings[stringIndex]
  if (open === undefined) throw new Error(`bad string index: ${stringIndex}`)
  if (fret < 0 || !Number.isInteger(fret)) throw new Error(`bad fret: ${fret}`)
  const midi = open + fret
  if (selection) {
    const rootChroma = Note.chroma(selection.root)
    if (rootChroma === undefined) throw new Error(`bad root: ${selection.root}`)
    for (const d of selectionDegrees(selection)) {
      if ((rootChroma + d.semitones) % 12 === midi % 12) {
        return {
          ...spelledPitch(midi, spellNote(selection.root, d.token, spelling)),
          inSelection: true,
        }
      }
    }
  }
  return { ...spelledPitch(midi, SHARP_NAMES[midi % 12]!), inSelection: false }
}
