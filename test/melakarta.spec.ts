import { describe, expect, it } from 'vitest'
import { generateMelakartaScales } from '../src/scales.js'

const melas = generateMelakartaScales()

describe('melakarta generator', () => {
  it('generates all 72, numbered and named', () => {
    expect(melas).toHaveLength(72)
    expect(melas[0]!.name).toBe('Mela Kanakangi (1)')
    expect(melas[71]!.name).toBe('Mela Rasikapriya (72)')
    expect(new Set(melas.map(m => m.id)).size).toBe(72)
  })

  it('uses shuddha madhyama for 1-36 and prati madhyama for 37-72', () => {
    for (const [i, m] of melas.entries()) {
      expect(m.intervals[3], m.name).toBe(i < 36 ? '4' : '#4')
      expect(m.intervals[0]).toBe('1')
      expect(m.intervals[4]).toBe('5')
    }
  })

  const spot: Array<[number, string[]]> = [
    [1, ['1', 'b2', '2', '4', '5', '#5', '6']],
    [8, ['1', 'b2', 'b3', '4', '5', 'b6', 'b7']], // Hanumattodi = Phrygian
    [19, ['1', '2', 'b3', '4', '5', '#5', '6']], // reference site data is broken here
    [29, ['1', '2', '3', '4', '5', '6', '7']], // Dhirasankarabharana = Major
    [44, ['1', 'b2', 'b3', '#4', '5', 'b6', 'b7']], // reference site data is broken here
    [65, ['1', '2', '3', '#4', '5', '6', '7']], // Mechakalyani = Lydian
    [72, ['1', '#2', '3', '#4', '5', '#6', '7']],
  ]
  it.each(spot)('mela %i has the canonical intervals', (n, expected) => {
    expect(melas[n - 1]!.intervals).toEqual(expected)
  })
})
