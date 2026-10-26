import { describe, expect, it } from 'vitest'
import {
  boxPattern,
  diagonalPattern,
  dotInBox,
  rootOctaveLinks,
  runPattern,
  selectionBoxes,
  sweepPath,
} from '../src/boxes.js'
import type { PatternNote } from '../src/boxes.js'
import { getFretboardDots, selectionChromaMap } from '../src/fretboard.js'
import { selectionPitches } from '../src/pitches.js'
import { selectionMidiNotes } from '../src/playback.js'
import { getTuning } from '../src/tunings.js'
import type { Selection } from '../src/types.js'

const FRETS = 12
const tunings = ['bass-4', 'bass-5', 'standard', 'seven-standard', 'seven-drop-a'] as const
const selections: Selection[] = [
  { mode: 'scale', root: 'E', typeId: 'major' },
  { mode: 'scale', root: 'A', typeId: 'pentatonic-minor' },
  { mode: 'chord', root: 'C', typeId: 'maj7' },
]
const cases = tunings.flatMap(id => selections.map(sel => [id, sel.root + ' ' + sel.typeId, sel] as const))

const checkNotes = (id: string, sel: Selection, notes: PatternNote[]) => {
  const t = getTuning(id)
  const chromas = new Set(selectionChromaMap(sel).keys())
  for (const n of notes) {
    expect(n.string).toBeGreaterThanOrEqual(0)
    expect(n.string).toBeLessThan(t.strings.length)
    expect(n.fret).toBeGreaterThanOrEqual(0)
    expect(n.fret).toBeLessThanOrEqual(FRETS)
    expect(n.midi).toBe(t.strings[n.string]! + n.fret)
    expect(chromas.has(n.midi % 12)).toBe(true)
  }
}

describe.each(cases)('%s with %s', (id, _label, sel) => {
  const t = getTuning(id)

  it('getFretboardDots stays on the neck and in the selection', () => {
    const chromas = new Set(selectionChromaMap(sel).keys())
    const dots = getFretboardDots(t, sel)
    expect(dots.length).toBeGreaterThan(0)
    for (const d of dots) {
      expect(d.string).toBeLessThan(t.strings.length)
      expect(d.fret).toBeGreaterThanOrEqual(0)
      expect(d.fret).toBeLessThanOrEqual(FRETS)
      expect(chromas.has(d.midi % 12)).toBe(true)
    }
    expect(new Set(dots.map(d => d.string)).size).toBe(t.strings.length)
  })

  it('selectionPitches are ascending, in the selection, with valid positions', () => {
    const chromas = new Set(selectionChromaMap(sel).keys())
    const pitches = selectionPitches(t, sel)
    const midis = pitches.map(p => p.midi)
    expect(midis).toEqual([...midis].sort((a, b) => a - b))
    for (const p of pitches) {
      expect(chromas.has(p.midi % 12)).toBe(true)
      for (const pos of p.positions) {
        expect(t.strings[pos.string]! + pos.fret).toBe(p.midi)
        expect(pos.fret).toBeLessThanOrEqual(FRETS)
      }
    }
  })

  it('selectionBoxes anchor within the neck', () => {
    const boxes = selectionBoxes(t, sel)
    expect(boxes.length).toBeGreaterThan(0)
    boxes.forEach((b, i) => {
      expect(b.index).toBe(i + 1)
      expect(b.minFret).toBeGreaterThanOrEqual(0)
      expect(b.maxFret).toBeLessThanOrEqual(FRETS)
      expect(dotInBox({ fret: b.minFret }, b)).toBe(true)
    })
  })

  it('every box pattern walk runs without throwing and stays valid', () => {
    for (const box of selectionBoxes(t, sel)) {
      checkNotes(id, sel, boxPattern(t, sel, box))
      checkNotes(id, sel, diagonalPattern(t, sel, box))
      checkNotes(id, sel, runPattern(t, sel, box))
      const sweep = sweepPath(t, sel, box)
      checkNotes(id, sel, sweep)
      const midis = sweep.map(n => n.midi)
      expect(midis).toEqual([...midis].sort((a, b) => a - b))
      expect(new Set(sweep.map(n => n.string)).size).toBe(sweep.length)
      for (const n of sweep) expect(dotInBox(n, box)).toBe(true)
    }
  })

  it('rootOctaveLinks join a root to its octave on a higher string', () => {
    const rootChroma = [...selectionChromaMap(sel)].find(([, d]) => d.degree === 1)![0]
    for (const { from, to } of rootOctaveLinks(t, sel)) {
      expect(from.midi % 12).toBe(rootChroma)
      expect(to.midi).toBe(from.midi + 12)
      expect(to.string).toBeGreaterThan(from.string)
      checkNotes(id, sel, [from, to])
    }
  })

  it('selectionMidiNotes does not depend on the tuning', () => {
    const { midi } = selectionMidiNotes(sel)
    expect(midi.length).toBeGreaterThan(0)
  })
})

describe('string counts', () => {
  it('diagonalPattern reaches the top string of a 4-string bass', () => {
    const t = getTuning('bass-4')
    const sel = selections[0]!
    const notes = diagonalPattern(t, sel, selectionBoxes(t, sel)[0]!)
    expect(new Set(notes.map(n => n.string))).toEqual(new Set([0, 1, 2, 3]))
  })

  it('a 4-string bass has fewer dots than a 6-string guitar', () => {
    const sel = selections[0]!
    expect(getFretboardDots(getTuning('bass-4'), sel).length).toBeLessThan(
      getFretboardDots(getTuning('standard'), sel).length,
    )
  })
})

describe('reentrant ukulele', () => {
  const uke = getTuning('ukulele')
  const lowG = getTuning('ukulele-low-g')
  const cMajor: Selection = { mode: 'scale', root: 'C', typeId: 'major' }

  it('has a first string that is not the lowest pitch', () => {
    expect(uke.strings[0]).toBeGreaterThan(uke.strings[1]!)
    expect(lowG.strings[0]).toBeLessThan(lowG.strings[1]!)
  })

  it('anchors boxes on the lowest-pitched string (the C string)', () => {
    const boxes = selectionBoxes(uke, cMajor)
    // C string is open C4: C major anchors on fret 0, then D at fret 2, ...
    expect(boxes[0]).toMatchObject({ minFret: 0, anchorDegree: '1' })
    expect(boxes.map(b => b.minFret)).toEqual([0, 2, 4, 5, 7, 9, 11])
    // the low-G ukulele's lowest string is its first: open G3 anchors at G, A, B, C, D, E, F
    expect(selectionBoxes(lowG, cMajor).map(b => b.minFret)).toEqual([0, 2, 4, 5, 7, 9, 10])
  })

  it('every pattern starts at the box anchor on the lowest-pitched string', () => {
    const anchorLow = Math.min(...uke.strings)
    for (const box of selectionBoxes(uke, cMajor)) {
      for (const fn of [boxPattern, diagonalPattern, runPattern, sweepPath]) {
        const notes = fn(uke, cMajor, box)
        checkNotes('ukulele', cMajor, notes)
        expect(notes[0], fn.name).toMatchObject({
          string: uke.strings.indexOf(anchorLow),
          fret: box.minFret,
          midi: anchorLow + box.minFret,
        })
      }
    }
  })

  it('climbs in pitch order across the reentrant string', () => {
    const box = selectionBoxes(uke, cMajor)[0]!
    for (const fn of [boxPattern, diagonalPattern, runPattern, sweepPath]) {
      const midis = fn(uke, cMajor, box).map(n => n.midi)
      expect(midis, fn.name).toEqual([...midis].sort((a, b) => a - b))
    }
  })
})
