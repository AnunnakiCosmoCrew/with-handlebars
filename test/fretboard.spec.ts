import { describe, expect, it } from 'vitest'
import { getFretboardDots } from '../src/fretboard.js'
import { getTuning, applyStringOffsets, STANDARD_TUNING } from '../src/tunings.js'
import type { FretDot, Selection } from '../src/types.js'

const sel = (mode: Selection['mode'], root: string, typeId: string): Selection => ({
  mode,
  root,
  typeId,
})

const onString = (dots: FretDot[], s: number) => dots.filter(d => d.string === s)

describe('getFretboardDots', () => {
  it('maps E major across standard tuning', () => {
    const dots = getFretboardDots(STANDARD_TUNING, sel('chord', 'E', 'major'))
    // Low E string: E0 G#4 B7 E12
    expect(onString(dots, 0).map(d => [d.fret, d.note, d.isRoot])).toEqual([
      [0, 'E', true],
      [4, 'G#', false],
      [7, 'B', false],
      [12, 'E', true],
    ])
    // B string: B open, E5, G#9, B12
    expect(onString(dots, 4).map(d => [d.fret, d.note])).toEqual([
      [0, 'B'],
      [5, 'E'],
      [9, 'G#'],
      [12, 'B'],
    ])
    // Both E strings and the fretted Es are roots; 6 strings * (0..12) sweep
    expect(dots.filter(d => d.isRoot).map(d => d.note)).toContain('E')
    expect(dots.every(d => !d.isOptional)).toBe(true)
  })

  it('shifts the low string in Drop D', () => {
    const dots = getFretboardDots(getTuning('drop-d'), sel('chord', 'E', 'major'))
    // Low D string: E at 2, G# at 6, B at 9 — and no open dot (D is not a chord tone)
    expect(onString(dots, 0).map(d => [d.fret, d.note])).toEqual([
      [2, 'E'],
      [6, 'G#'],
      [9, 'B'],
    ])
    // Other strings unchanged from standard
    const std = getFretboardDots(STANDARD_TUNING, sel('chord', 'E', 'major'))
    expect(onString(dots, 1)).toEqual(onString(std, 1))
  })

  it('spells C# major and Db major differently on the same frets', () => {
    const cs = getFretboardDots(STANDARD_TUNING, sel('chord', 'C#', 'major'))
    const db = getFretboardDots(STANDARD_TUNING, sel('chord', 'Db', 'major'))
    expect(cs.map(d => [d.string, d.fret])).toEqual(db.map(d => [d.string, d.fret]))
    expect(new Set(cs.map(d => d.note))).toEqual(new Set(['C#', 'E#', 'G#']))
    expect(new Set(db.map(d => d.note))).toEqual(new Set(['Db', 'F', 'Ab']))
  })

  it('keeps the double sharp in strict spelling and folds it in simple', () => {
    const strict = getFretboardDots(STANDARD_TUNING, sel('chord', 'E', '7s9'), 'strict')
    const simple = getFretboardDots(STANDARD_TUNING, sel('chord', 'E', '7s9'), 'simple')
    expect(strict.some(d => d.note === 'F##')).toBe(true)
    expect(simple.some(d => d.note === 'F##')).toBe(false)
    expect(simple.some(d => d.note === 'G')).toBe(true)
  })

  it('maps a Melakarta raga', () => {
    const dots = getFretboardDots(STANDARD_TUNING, sel('scale', 'E', 'mela-kanakangi-1'))
    expect(new Set(dots.map(d => d.note))).toEqual(
      new Set(['E', 'F', 'F#', 'A', 'B', 'B#', 'C#']),
    )
    // 7 pitch classes over 6 strings x 13 positions
    expect(dots.length).toBe(
      STANDARD_TUNING.strings.reduce(
        (acc, open) =>
          acc +
          Array.from({ length: 13 }, (_, f) => (open + f) % 12).filter(pc =>
            [4, 5, 6, 9, 11, 0, 1].includes(pc),
          ).length,
        0,
      ),
    )
  })

  it('flags optional tones', () => {
    const dots = getFretboardDots(STANDARD_TUNING, sel('chord', 'E', '9'))
    const fifths = dots.filter(d => d.degree === '5')
    expect(fifths.length).toBeGreaterThan(0)
    expect(fifths.every(d => d.isOptional)).toBe(true)
    expect(dots.filter(d => d.degree === '1').every(d => d.isRoot && !d.isOptional)).toBe(true)
  })

  it('marks an optional root as both root and optional', () => {
    const dots = getFretboardDots(STANDARD_TUNING, sel('chord', 'E', '13b9b5'))
    const roots = dots.filter(d => d.isRoot)
    expect(roots.length).toBeGreaterThan(0)
    expect(roots.every(d => d.isOptional)).toBe(true)
  })

  it('respects per-string tuner offsets', () => {
    const detuned = applyStringOffsets(STANDARD_TUNING, [-2, 0, 0, 0, 0, 0])
    expect(detuned.strings[0]).toBe(38)
    expect(detuned.letters[0]).toBe('D')
    expect(detuned.letters.slice(1)).toEqual(STANDARD_TUNING.letters.slice(1))
    const dots = getFretboardDots(detuned, sel('chord', 'E', 'major'))
    expect(onString(dots, 0).map(d => d.fret)).toEqual([2, 6, 9])
  })

  it('returns the base tuning object when all offsets are zero', () => {
    expect(applyStringOffsets(STANDARD_TUNING, [0, 0, 0, 0, 0, 0])).toBe(STANDARD_TUNING)
  })
})
