import { Note } from 'tonal'
import type { Selection } from './types.js'
import { selectionDegrees } from './fretboard.js'

export type PlaybackKind = 'strum' | 'sequence'

export type PlaybackNotes = {
  /** Ascending MIDI notes, root first. */
  midi: number[]
  /** How the notes are meant to be played: chords strum, scales run. */
  kind: PlaybackKind
}

/**
 * Notes for the Play button. Chords are voiced as a root-position stack —
 * every chord tone, optional ones included, ascending from the root (plan
 * open decision #3). Scales run ascending over one octave and top out on the
 * octave root.
 *
 * The root lands in octave 3 (C3=48 … B3=59), the heart of the guitar's
 * range in every supported tuning.
 */
export function selectionMidiNotes(selection: Selection): PlaybackNotes {
  const chroma = Note.chroma(selection.root)
  if (chroma === undefined) throw new Error(`bad root: ${selection.root}`)
  const rootMidi = 48 + chroma
  const midi = selectionDegrees(selection).map(d => rootMidi + d.semitones)
  if (selection.mode === 'scale') midi.push(rootMidi + 12)
  return { midi, kind: selection.mode === 'chord' ? 'strum' : 'sequence' }
}
