import { describe, expect, it } from 'vitest'
import { getFretboardDots } from '../src/fretboard.js'
import { identifyPosition, selectionPitches } from '../src/pitches.js'
import { STANDARD_TUNING } from '../src/tunings.js'
import type { Selection } from '../src/types.js'

const sel = (mode: Selection['mode'], root: string, typeId: string): Selection => ({
  mode,
  root,
  typeId,
})

describe('FretDot.midi', () => {
  it('is always the open-string midi plus the fret', () => {
    const dots = getFretboardDots(STANDARD_TUNING, sel('scale', 'E', 'major'), 'strict', 24)
    expect(dots.length).toBeGreaterThan(0)
    for (const d of dots) {
      expect(d.midi).toBe(STANDARD_TUNING.strings[d.string]! + d.fret)
    }
  })
})

describe('selectionPitches', () => {
  it('inventories E major on the standard 12-fret neck', () => {
    const pitches = selectionPitches(STANDARD_TUNING, sel('chord', 'E', 'major'))
    // every distinct exact pitch, ascending
    expect(pitches.map(p => `${p.name}${p.octave}`)).toEqual([
      'E2', 'G#2', 'B2', 'E3', 'G#3', 'B3', 'E4', 'G#4', 'B4', 'E5',
    ])
    expect(pitches.map(p => p.midi)).toEqual([40, 44, 47, 52, 56, 59, 64, 68, 71, 76])
    expect(pitches.map(p => p.isRoot)).toEqual([
      true, false, false, true, false, false, true, false, false, true,
    ])
  })

  it('collects every position of a pitch, low string first', () => {
    const pitches = selectionPitches(STANDARD_TUNING, sel('chord', 'E', 'major'))
    const e3 = pitches.find(p => p.midi === 52)!
    expect(e3.positions).toEqual([
      { string: 0, fret: 12 },
      { string: 1, fret: 7 },
      { string: 2, fret: 2 },
    ])
    // open low E exists in exactly one place
    expect(pitches.find(p => p.midi === 40)!.positions).toEqual([{ string: 0, fret: 0 }])
  })

  it('splits letter and accidental and grows with the fret count', () => {
    const p12 = selectionPitches(STANDARD_TUNING, sel('chord', 'E', 'major'))
    const p24 = selectionPitches(STANDARD_TUNING, sel('chord', 'E', 'major'), 'strict', 24)
    expect(p24.length).toBeGreaterThan(p12.length)
    const gSharp = p12.find(p => p.name === 'G#')!
    expect(gSharp.letter).toBe('G')
    expect(gSharp.accidental).toBe('#')
  })

  it('places wrap-around spellings in the octave of their letter', () => {
    // C# major scale: its 7th is B#, sounding the same midi as C.
    const pitches = selectionPitches(STANDARD_TUNING, sel('scale', 'C#', 'major'))
    const bSharp = pitches.find(p => p.name === 'B#' && p.midi === 60)!
    expect(bSharp.octave).toBe(3) // B#3 sounds midi 60, not B#4
    // Gb major scale: its 4th is Cb, sounding the same midi as B.
    const gb = selectionPitches(STANDARD_TUNING, sel('scale', 'Gb', 'major'))
    const cFlat = gb.find(p => p.name === 'Cb' && p.midi === 59)!
    expect(cFlat.octave).toBe(4) // Cb4 sounds midi 59, not Cb3
  })
})

describe('identifyPosition', () => {
  it('spells in-selection pitches with the selection spelling', () => {
    // B string fret 1 sounds midi 60; in C# major that is B#, the 7th.
    const p = identifyPosition(STANDARD_TUNING, 4, 1, sel('scale', 'C#', 'major'))
    expect(p).toMatchObject({ midi: 60, name: 'B#', octave: 3, inSelection: true })
  })

  it('simplifies in-selection spelling in simple mode', () => {
    const p = identifyPosition(STANDARD_TUNING, 4, 1, sel('scale', 'C#', 'major'), 'simple')
    expect(p).toMatchObject({ midi: 60, name: 'C', octave: 4, inSelection: true })
  })

  it('uses simple sharp spelling outside the selection', () => {
    // D string fret 3 = F3, not an E major tone
    const f3 = identifyPosition(STANDARD_TUNING, 2, 3, sel('chord', 'E', 'major'))
    expect(f3).toMatchObject({ midi: 53, name: 'F', octave: 3, inSelection: false })
    // high E string fret 2 = F#4
    const fs4 = identifyPosition(STANDARD_TUNING, 5, 2, sel('chord', 'E', 'major'))
    expect(fs4).toMatchObject({
      midi: 66, name: 'F#', letter: 'F', accidental: '#', octave: 4, inSelection: false,
    })
  })

  it('works with no selection at all', () => {
    const p = identifyPosition(STANDARD_TUNING, 0, 0)
    expect(p).toMatchObject({ midi: 40, name: 'E', octave: 2, inSelection: false })
  })

  it('rejects bad positions', () => {
    expect(() => identifyPosition(STANDARD_TUNING, 9, 0)).toThrow()
    expect(() => identifyPosition(STANDARD_TUNING, 0, -1)).toThrow()
  })
})
