import { describe, expect, it } from 'vitest'
import { selectionMidiNotes } from '../src/playback.js'

describe('selectionMidiNotes', () => {
  it('voices a chord as a root-position stack', () => {
    expect(selectionMidiNotes({ mode: 'chord', root: 'E', typeId: 'major' })).toEqual({
      midi: [52, 56, 59], // E3 G#3 B3
      kind: 'strum',
    })
  })

  it('includes optional tones and extensions beyond the octave', () => {
    const { midi } = selectionMidiNotes({ mode: 'chord', root: 'C', typeId: '9' })
    expect(midi).toEqual([48, 52, 55, 58, 62]) // C3 E3 G3 Bb3 D4
  })

  it('respects enharmonic roots identically in pitch', () => {
    const cs = selectionMidiNotes({ mode: 'chord', root: 'C#', typeId: 'major' })
    const db = selectionMidiNotes({ mode: 'chord', root: 'Db', typeId: 'major' })
    expect(cs.midi).toEqual(db.midi)
  })

  it('runs scales ascending and tops out on the octave root', () => {
    expect(selectionMidiNotes({ mode: 'scale', root: 'E', typeId: 'major' })).toEqual({
      midi: [52, 54, 56, 57, 59, 61, 63, 64],
      kind: 'sequence',
    })
  })

  it('keeps the root in octave 3 for every chromatic root', () => {
    for (const root of ['C', 'C#', 'Db', 'E', 'Gb', 'A#', 'B']) {
      const { midi } = selectionMidiNotes({ mode: 'chord', root, typeId: 'major' })
      expect(midi[0]).toBeGreaterThanOrEqual(48)
      expect(midi[0]).toBeLessThan(60)
    }
  })
})
