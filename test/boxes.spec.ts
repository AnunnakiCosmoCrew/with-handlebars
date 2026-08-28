import { describe, expect, it } from 'vitest'
import { boxPattern, dotInBox, selectionBoxes } from '../src/boxes.js'
import { STANDARD_TUNING, getTuning } from '../src/tunings.js'
import type { Selection } from '../src/types.js'

const sel = (mode: Selection['mode'], root: string, typeId: string): Selection => ({
  mode,
  root,
  typeId,
})

describe('selectionBoxes', () => {
  it('gives a diatonic scale seven boxes on the 12-fret neck', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, sel('scale', 'E', 'major'))
    expect(boxes.map(b => [b.index, b.minFret, b.anchorDegree])).toEqual([
      [1, 0, '1'],
      [2, 2, '2'],
      [3, 4, '3'],
      [4, 5, '4'],
      [5, 7, '5'],
      [6, 9, '6'],
      [7, 11, '7'],
    ])
    expect(boxes[0]!.maxFret).toBe(4)
    // the last box is clipped at the neck end, never dropped
    expect(boxes[6]!.maxFret).toBe(12)
  })

  it('keeps adding positions up longer necks', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, sel('scale', 'E', 'major'), 24)
    expect(boxes).toHaveLength(14)
    // the octave of position 1 is its own position, an octave up
    expect(boxes[7]!).toMatchObject({ index: 8, minFret: 12, maxFret: 16, anchorDegree: '1' })
    expect(boxes[13]!).toMatchObject({ minFret: 23, maxFret: 24 })
  })

  it('gives a pentatonic scale five boxes', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, sel('scale', 'E', 'pentatonic-minor'))
    expect(boxes.map(b => b.minFret)).toEqual([0, 3, 5, 7, 10])
  })

  it('gives a triad chord three arpeggio boxes on 12 frets, five on 20', () => {
    const at12 = selectionBoxes(STANDARD_TUNING, sel('chord', 'G', 'major'))
    expect(at12.map(b => [b.minFret, b.anchorDegree])).toEqual([
      [3, '1'],
      [7, '3'],
      [10, '5'],
    ])
    const at20 = selectionBoxes(STANDARD_TUNING, sel('chord', 'G', 'major'), 20)
    expect(at20.map(b => b.minFret)).toEqual([3, 7, 10, 15, 19])
  })

  it('counts optional chord tones as anchors', () => {
    // '9' is 1 3 (5) b7 9 — five distinct tones, optional 5 included
    const boxes = selectionBoxes(STANDARD_TUNING, sel('chord', 'E', '9'))
    expect(boxes).toHaveLength(5)
  })

  it('anchors follow the lowest string of the tuning', () => {
    const boxes = selectionBoxes(getTuning('drop-d'), sel('chord', 'E', 'major'))
    expect(boxes.map(b => b.minFret)).toEqual([2, 6, 9])
  })

  it('gives the chromatic scale a box on every fret below the last', () => {
    expect(selectionBoxes(STANDARD_TUNING, sel('scale', 'E', 'chromatic'))).toHaveLength(12)
    expect(selectionBoxes(STANDARD_TUNING, sel('scale', 'E', 'chromatic'), 24)).toHaveLength(24)
  })

  it('refuses necks shorter than twelve frets', () => {
    expect(() => selectionBoxes(STANDARD_TUNING, sel('scale', 'E', 'major'), 11)).toThrow()
  })
})

describe('dotInBox', () => {
  const eMajor = sel('scale', 'E', 'major')

  it('is a plain inclusive fret-range check', () => {
    const box3 = selectionBoxes(STANDARD_TUNING, eMajor)[2]! // [4, 8]
    expect(dotInBox({ fret: 4 }, box3)).toBe(true)
    expect(dotInBox({ fret: 8 }, box3)).toBe(true)
    expect(dotInBox({ fret: 3 }, box3)).toBe(false)
    expect(dotInBox({ fret: 9 }, box3)).toBe(false)
  })

  it('keeps positions distinct across octaves', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, eMajor, 24)
    expect(dotInBox({ fret: 13 }, boxes[0]!)).toBe(false) // fret 13 is box 8's turf
    expect(dotInBox({ fret: 13 }, boxes[7]!)).toBe(true)
  })

  it('grants open strings only to the fret-0 box', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, eMajor)
    expect(dotInBox({ fret: 0 }, boxes[0]!)).toBe(true)
    expect(dotInBox({ fret: 0 }, boxes[1]!)).toBe(false)
  })
})

describe('boxPattern', () => {
  const eMajor = sel('scale', 'E', 'major')
  const onString = (notes: ReturnType<typeof boxPattern>, s: number) =>
    notes.filter(n => n.string === s).map(n => n.fret)

  it('walks a diatonic scale three notes per string from the anchor', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, eMajor)
    const pattern = boxPattern(STANDARD_TUNING, eMajor, boxes[0]!)
    expect(pattern).toHaveLength(18)
    expect(onString(pattern, 0)).toEqual([0, 2, 4]) // E F# G#
    expect(onString(pattern, 1)).toEqual([0, 2, 4]) // A B C#
    expect(onString(pattern, 2)).toEqual([1, 2, 4]) // D# E F#
    expect(onString(pattern, 3)).toEqual([1, 2, 4]) // G# A B
    expect(onString(pattern, 4)).toEqual([2, 4, 5]) // C# D# E
    expect(onString(pattern, 5)).toEqual([2, 4, 5]) // F# G# A
    // consecutive scale tones, strictly ascending across the whole walk
    const midis = pattern.map(n => n.midi)
    expect(midis).toEqual([...midis].sort((a, b) => a - b))
    expect(new Set(midis).size).toBe(midis.length)
  })

  it('drifts with the anchor instead of staying in the rectangle', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, eMajor)
    const pattern = boxPattern(STANDARD_TUNING, eMajor, boxes[3]!) // anchor 5
    expect(onString(pattern, 0)).toEqual([5, 7, 9]) // A B C#
    // the walk climbs out of the 5-fret rectangle as it crosses strings
    expect(pattern.some(n => n.fret > boxes[3]!.maxFret)).toBe(true)
  })

  it('takes two to three notes per string for a pentatonic', () => {
    const penta = sel('scale', 'E', 'pentatonic-minor')
    const boxes = selectionBoxes(STANDARD_TUNING, penta)
    const pattern = boxPattern(STANDARD_TUNING, penta, boxes[0]!)
    const counts = STANDARD_TUNING.strings.map((_, s) => onString(pattern, s).length)
    expect(counts.every(c => c >= 2 && c <= 3)).toBe(true)
    expect(onString(pattern, 0)).toEqual([0, 3]) // E G
  })

  it('walks chord tones as an arpeggio pattern', () => {
    const g = sel('chord', 'G', 'major')
    const boxes = selectionBoxes(STANDARD_TUNING, g)
    const pattern = boxPattern(STANDARD_TUNING, g, boxes[0]!) // anchor 3
    expect(pattern[0]).toMatchObject({ string: 0, fret: 3, midi: 43 })
    const midis = pattern.map(n => n.midi)
    expect(midis).toEqual([...midis].sort((a, b) => a - b))
    // every note is a G/B/D pitch class
    expect(midis.every(m => [7, 11, 2].includes(m % 12))).toBe(true)
  })

  it('skips tones that would land below the nut on a big string interval', () => {
    // Drop D: A follows D by 7 semitones; a low anchor can push the walk's
    // continuation under fret 0 on the next string.
    const dropD = getTuning('drop-d')
    const boxes = selectionBoxes(dropD, eMajor)
    const pattern = boxPattern(dropD, eMajor, boxes[0]!)
    expect(pattern.every(n => n.fret >= 0)).toBe(true)
    const midis = pattern.map(n => n.midi)
    expect(midis).toEqual([...midis].sort((a, b) => a - b))
  })

  it('stays within the neck', () => {
    const boxes = selectionBoxes(STANDARD_TUNING, eMajor, 12)
    const pattern = boxPattern(STANDARD_TUNING, eMajor, boxes[6]!, 12) // anchor 11
    expect(pattern.length).toBeGreaterThan(0)
    expect(pattern.every(n => n.fret <= 12)).toBe(true)
  })

  it('rejects a box that does not anchor a selection tone', () => {
    // fret 1 on the low E string is F natural — not an E major tone
    const rogue = { index: 1, anchorDegree: '1', minFret: 1, maxFret: 5 }
    expect(() => boxPattern(STANDARD_TUNING, eMajor, rogue)).toThrow(/does not anchor/)
  })

  it('rejects a box that does not fit the neck', () => {
    // a high position from a 24-fret neck, walked with the default 12
    const box14 = selectionBoxes(STANDARD_TUNING, eMajor, 24).at(-1)!
    expect(box14.minFret).toBe(23)
    expect(() => boxPattern(STANDARD_TUNING, eMajor, box14)).toThrow(/do not fit/)
    expect(boxPattern(STANDARD_TUNING, eMajor, box14, 24).length).toBeGreaterThan(0)
    const inverted = { index: 1, anchorDegree: '1', minFret: 5, maxFret: 4 }
    expect(() => boxPattern(STANDARD_TUNING, eMajor, inverted)).toThrow(/do not fit/)
  })
})
