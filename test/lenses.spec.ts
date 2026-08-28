import { describe, expect, it } from 'vitest'
import {
  boxPattern,
  diagonalPattern,
  rootOctaveLinks,
  runPattern,
  selectionBoxes,
  sweepPath,
} from '../src/boxes.js'
import { STANDARD_TUNING } from '../src/tunings.js'
import type { Selection, Tuning } from '../src/types.js'

const sel = (mode: Selection['mode'], root: string, typeId: string): Selection => ({
  mode,
  root,
  typeId,
})

const eMajor = sel('scale', 'E', 'major')
const onString = (notes: { string: number; fret: number }[], s: number) =>
  notes.filter(n => n.string === s).map(n => n.fret)
const ascending = (notes: { midi: number }[]) => {
  const midis = notes.map(n => n.midi)
  expect(midis).toEqual([...midis].sort((a, b) => a - b))
  expect(new Set(midis).size).toBe(midis.length)
}

describe('diagonalPattern', () => {
  it('carries one octave per string pair, climbing the neck', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, eMajor)
    const notes = diagonalPattern(STANDARD_TUNING, eMajor, boxes[0]!)
    expect(notes).toHaveLength(21)
    expect(onString(notes, 0)).toEqual([0, 2, 4, 5]) // E F# G# A
    expect(onString(notes, 1)).toEqual([2, 4, 6]) // B C# D#
    expect(onString(notes, 2)).toEqual([2, 4, 6, 7]) // E F# G# A
    expect(onString(notes, 3)).toEqual([4, 6, 8]) // B C# D#
    expect(onString(notes, 4)).toEqual([5, 7, 9, 10]) // E F# G# A
    expect(onString(notes, 5)).toEqual([7, 9, 11]) // B C# D#
    ascending(notes)
    // each pair covers exactly its octave: pair p holds midis [40+12p, 52+12p)
    for (const n of notes) {
      const pair = Math.floor(n.string / 2)
      expect(n.midi).toBeGreaterThanOrEqual(40 + 12 * pair)
      expect(n.midi).toBeLessThan(52 + 12 * pair)
    }
  })

  it('reproduces the classic pentatonic diagonal, no tone dropped', () => {
    const penta = sel('scale', 'E', 'pentatonic-minor')
    const boxes = selectionBoxes(STANDARD_TUNING, penta)
    const notes = diagonalPattern(STANDARD_TUNING, penta, boxes[0]!)
    expect(notes).toHaveLength(15)
    expect(onString(notes, 0)).toEqual([0, 3, 5]) // E G A
    expect(onString(notes, 1)).toEqual([2, 5]) // B D
    expect(onString(notes, 2)).toEqual([2, 5, 7])
    expect(onString(notes, 3)).toEqual([4, 7])
    expect(onString(notes, 4)).toEqual([5, 8, 10])
    expect(onString(notes, 5)).toEqual([7, 10])
    ascending(notes)
  })

  it('gives an odd last string its octave alone', () => {
    const seven: Tuning = {
      id: 'seven',
      name: 'Seven',
      strings: [35, ...STANDARD_TUNING.strings],
      letters: ['B', ...STANDARD_TUNING.letters],
    }
    const boxes = selectionBoxes(seven, eMajor, 24)
    const notes = diagonalPattern(seven, eMajor, boxes[0]!, 24)
    const lastString = notes.filter(n => n.string === 6)
    expect(lastString.length).toBeGreaterThan(0)
    // string 6 is pair 3 on its own: midis within [anchor+36, anchor+48)
    const anchor = notes[0]!.midi
    for (const n of lastString) {
      expect(n.midi).toBeGreaterThanOrEqual(anchor + 36)
      expect(n.midi).toBeLessThan(anchor + 48)
    }
  })

  it('rejects a rogue box like the other walks', () => {
    const rogue = { index: 1, anchorDegree: '1', minFret: 1, maxFret: 5 }
    expect(() => diagonalPattern(STANDARD_TUNING, eMajor, rogue)).toThrow(/does not anchor/)
    const wide = { index: 1, anchorDegree: '1', minFret: 0, maxFret: 30 }
    expect(() => diagonalPattern(STANDARD_TUNING, eMajor, wide)).toThrow(/do not fit/)
  })
})

describe('runPattern', () => {
  it('matches boxPattern below the last string, then shifts up it to the neck end', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, eMajor)
    const run = runPattern(STANDARD_TUNING, eMajor, boxes[0]!)
    const box = boxPattern(STANDARD_TUNING, eMajor, boxes[0]!)
    for (let s = 0; s < 5; s++) expect(onString(run, s)).toEqual(onString(box, s))
    // the last string keeps shifting: F# G# A, shift, B C# D#, shift, E
    expect(onString(run, 5)).toEqual([2, 4, 5, 7, 9, 11, 12])
    ascending(run)
  })

  it('runs all the way out on a long neck', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, eMajor, 24)
    const run = runPattern(STANDARD_TUNING, eMajor, boxes[0]!, 24)
    expect(Math.max(...run.map(n => n.fret))).toBe(24) // E6 caps the 24-fret string
    expect(run.every(n => n.fret <= 24)).toBe(true)
    ascending(run)
  })
})

describe('sweepPath', () => {
  it('walks the open-E shape for the E major arpeggio box', () => {
    const e = sel('chord', 'E', 'major')
    const boxes = selectionBoxes(STANDARD_TUNING, e)
    const path = sweepPath(STANDARD_TUNING, e, boxes[0]!)
    expect(path.map(n => [n.string, n.fret])).toEqual([
      [0, 0],
      [1, 2],
      [2, 2],
      [3, 1],
      [4, 0],
      [5, 0],
    ])
    ascending(path)
  })

  it('finds one tone per string ascending through a mid-neck box', () => {
    const g = sel('chord', 'G', 'major')
    const boxes = selectionBoxes(STANDARD_TUNING, g)
    const path = sweepPath(STANDARD_TUNING, g, boxes[0]!) // anchor 3, window [3, 7]
    expect(path.map(n => [n.string, n.fret])).toEqual([
      [0, 3],
      [1, 5],
      [2, 5],
      [3, 4],
      [4, 3],
      [5, 3],
    ])
  })

  it('skips a string with no ascending tone in the window', () => {
    const power = sel('chord', 'E', '5')
    const boxes = selectionBoxes(STANDARD_TUNING, power)
    const path = sweepPath(STANDARD_TUNING, power, boxes[0]!)
    // string 4 has no E or B above the already-taken B3 inside frets 0–4
    expect(path.map(n => n.string)).toEqual([0, 1, 2, 3, 5])
    ascending(path)
  })
})

describe('rootOctaveLinks', () => {
  it('links every root to its two-strings-over octave shape in standard tuning', () => {
    const links = rootOctaveLinks(STANDARD_TUNING, eMajor)
    expect(links.length).toBeGreaterThan(0)
    for (const { from, to } of links) {
      expect(to.midi).toBe(from.midi + 12)
      expect(to.string).toBeGreaterThan(from.string)
      expect(from.midi % 12).toBe(4) // every from is an E
    }
    const find = (s: number, f: number) =>
      links.find(l => l.from.string === s && l.from.fret === f)!
    expect(find(0, 0).to).toMatchObject({ string: 2, fret: 2 }) // the classic shape
    // a tie in fret displacement keeps the lower string
    expect(find(1, 7).to).toMatchObject({ string: 3, fret: 9 })
  })

  it('reaches over the fold for a root the neck end crowds', () => {
    const links = rootOctaveLinks(STANDARD_TUNING, eMajor)
    const high = links.find(l => l.from.string === 0 && l.from.fret === 12)!
    // E4's octave on strings 1–2 would sit past fret 12; the G string hosts it
    expect(high.to).toMatchObject({ string: 3, fret: 9 })
  })

  it('works for any root chroma, not just E', () => {
    const links = rootOctaveLinks(STANDARD_TUNING, sel('chord', 'Db', 'm7'))
    expect(links.length).toBeGreaterThan(0)
    for (const { from } of links) expect(from.midi % 12).toBe(1)
  })
})
