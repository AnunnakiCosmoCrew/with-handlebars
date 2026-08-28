import { describe, expect, it } from 'vitest'
import {
  SEQUENCE_PATTERN_IDS,
  notePositions,
  sequenceIndices,
  sequenceNotes,
} from '../src/index.js'
import type { SequencePatternId } from '../src/index.js'
import { STANDARD_TUNING } from '../src/tunings.js'

describe('sequenceIndices', () => {
  const cases: [SequencePatternId, number, number[]][] = [
    ['asc', 5, [0, 1, 2, 3, 4]],
    ['desc', 5, [4, 3, 2, 1, 0]],
    ['updown', 5, [0, 1, 2, 3, 4, 3, 2, 1, 0]],
    ['thirds', 5, [0, 2, 1, 3, 2, 4]],
    ['thirds', 8, [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7]],
    ['fourths', 5, [0, 3, 1, 4]],
    ['groups3', 5, [0, 1, 2, 1, 2, 3, 2, 3, 4]],
    ['groups4', 5, [0, 1, 2, 3, 1, 2, 3, 4]],
  ]
  it.each(cases)('%s over %i notes', (pattern, count, expected) => {
    expect(sequenceIndices(count, pattern)).toEqual(expected)
  })

  it('falls back to the plain run when no full group fits', () => {
    expect(sequenceIndices(2, 'thirds')).toEqual([0, 1])
    expect(sequenceIndices(3, 'fourths')).toEqual([0, 1, 2])
    expect(sequenceIndices(3, 'groups4')).toEqual([0, 1, 2])
    expect(sequenceIndices(1, 'updown')).toEqual([0])
  })

  it('handles the empty run and rejects bad counts', () => {
    for (const pattern of SEQUENCE_PATTERN_IDS) {
      expect(sequenceIndices(0, pattern)).toEqual([])
    }
    expect(() => sequenceIndices(-1, 'asc')).toThrow()
    expect(() => sequenceIndices(2.5, 'asc')).toThrow()
    expect(() => sequenceIndices(5, 'zigzag' as SequencePatternId)).toThrow(/pattern/)
  })
})

describe('sequenceNotes', () => {
  it('maps the pattern over an actual midi run', () => {
    expect(sequenceNotes([60, 62, 64, 65, 67], 'thirds')).toEqual([60, 64, 62, 65, 64, 67])
    expect(sequenceNotes([60, 64, 67], 'updown')).toEqual([60, 64, 67, 64, 60])
  })
})

describe('notePositions', () => {
  it('finds every G on the standard neck, low string and fret first', () => {
    expect(notePositions(STANDARD_TUNING, 'G')).toEqual([
      { string: 0, fret: 3, midi: 43 },
      { string: 1, fret: 10, midi: 55 },
      { string: 2, fret: 5, midi: 55 },
      { string: 3, fret: 0, midi: 55 },
      { string: 3, fret: 12, midi: 67 },
      { string: 4, fret: 8, midi: 67 },
      { string: 5, fret: 3, midi: 67 },
    ])
  })

  it('works from any spelling of the pitch class', () => {
    expect(notePositions(STANDARD_TUNING, 'F##')).toEqual(notePositions(STANDARD_TUNING, 'G'))
    expect(notePositions(STANDARD_TUNING, 'Abb')).toEqual(notePositions(STANDARD_TUNING, 'G'))
  })

  it('respects the fret count', () => {
    const long = notePositions(STANDARD_TUNING, 'E', 24)
    expect(long.filter(p => p.fret > 12).length).toBeGreaterThan(0)
    expect(notePositions(STANDARD_TUNING, 'E', 12).every(p => p.fret <= 12)).toBe(true)
  })

  it('rejects garbage notes', () => {
    expect(() => notePositions(STANDARD_TUNING, 'H')).toThrow()
  })
})
