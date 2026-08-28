import { Note } from 'tonal'
import type { Tuning } from './types.js'

/**
 * The 23 tuning presets, low string to high. Authored as spelled notes with
 * octaves so letters and MIDI can never drift apart.
 */
const tuning = (id: string, name: string, notes: string): Tuning => {
  const spelled = notes.split(' ')
  return {
    id,
    name,
    strings: spelled.map(n => {
      const midi = Note.midi(n)
      if (midi === null) throw new Error(`bad tuning note ${n} in ${id}`)
      return midi
    }),
    letters: spelled.map(n => Note.pitchClass(n)),
  }
}

export const TUNINGS: Tuning[] = [
  tuning('standard', 'Standard', 'E2 A2 D3 G3 B3 E4'),
  tuning('d-standard', 'D Standard', 'D2 G2 C3 F3 A3 D4'),
  tuning('c-standard', 'C Standard', 'C2 F2 A#2 D#3 G3 C4'),
  tuning('drop-d', 'Drop D', 'D2 A2 D3 G3 B3 E4'),
  tuning('drop-c', 'Drop C', 'C2 G2 C3 F3 A3 D4'),
  tuning('drop-a', 'Drop A', 'A1 A2 D3 G3 B3 E4'),
  tuning('double-drop-d', 'Double Drop D', 'D2 A2 D3 G3 B3 D4'),
  tuning('open-a', 'Open A', 'E2 A2 E3 A3 C#4 E4'),
  tuning('open-a-minor', 'Open A Minor', 'E2 A2 E3 A3 C4 E4'),
  tuning('open-c', 'Open C', 'C2 G2 C3 G3 C4 E4'),
  tuning('open-c6', 'Open C6', 'C2 G2 C3 G3 A3 E4'),
  tuning('open-d', 'Open D', 'D2 A2 D3 F#3 A3 D4'),
  tuning('open-d-minor', 'Open D Minor', 'D2 A2 D3 F3 A3 D4'),
  tuning('open-d5', 'Open D5', 'D2 A2 D3 D3 A3 D4'),
  tuning('open-e', 'Open E', 'E2 B2 E3 G#3 B3 E4'),
  tuning('open-g', 'Open G', 'D2 G2 D3 G3 B3 D4'),
  tuning('open-g-dobro', 'Open G (Dobro)', 'G2 B2 D3 G3 B3 D4'),
  tuning('open-g-minor', 'Open G Minor', 'D2 G2 D3 G3 A#3 D4'),
  tuning('open-g6', 'Open G6', 'D2 G2 D3 G3 B3 E4'),
  tuning('celtic', 'Celtic/Irish', 'D2 A2 D3 G3 A3 D4'),
  tuning('low-c', 'Low C', 'C2 G2 D3 G3 A3 D4'),
  tuning('all-fourths', 'All Fourths', 'E2 A2 D3 G3 C4 F4'),
  tuning('nst', 'New Standard (NST)', 'C2 G2 D3 A3 E4 G4'),
]

const byId = new Map(TUNINGS.map(t => [t.id, t]))

export function getTuning(id: string): Tuning {
  const t = byId.get(id)
  if (!t) throw new Error(`unknown tuning: ${id}`)
  return t
}

export const STANDARD_TUNING = getTuning('standard')

/**
 * Apply per-string semitone offsets to a base tuning, producing the custom
 * tuning the per-string ± buttons create. Offset length must match the string
 * count. Letters are respelled chromatically (sharp preference), matching how
 * an altered string no longer carries the preset's spelling intent.
 */
export function applyStringOffsets(base: Tuning, offsets: number[]): Tuning {
  if (offsets.length !== base.strings.length)
    throw new Error(`expected ${base.strings.length} offsets, got ${offsets.length}`)
  if (offsets.every(o => o === 0)) return base
  const strings = base.strings.map((m, i) => m + offsets[i]!)
  return {
    id: 'custom',
    name: 'Custom',
    strings,
    letters: strings.map((m, i) =>
      offsets[i] === 0 ? base.letters[i]! : Note.pitchClass(Note.fromMidiSharps(m)),
    ),
  }
}
