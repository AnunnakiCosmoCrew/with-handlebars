import { describe, expect, it } from 'vitest'
import { Note } from 'tonal'
import { TUNINGS, getTuning } from '../src/tunings.js'

describe('tuning presets', () => {
  it('has all 23 reference presets', () => {
    expect(TUNINGS).toHaveLength(23)
    expect(new Set(TUNINGS.map(t => t.id)).size).toBe(23)
  })

  it('standard is EADGBE at the right octaves', () => {
    expect(getTuning('standard').strings).toEqual([40, 45, 50, 55, 59, 64])
    expect(getTuning('standard').letters).toEqual(['E', 'A', 'D', 'G', 'B', 'E'])
  })

  it.each(TUNINGS.map(t => [t.id, t] as const))('%s letters agree with MIDI', (_id, t) => {
    expect(t.strings).toHaveLength(6)
    expect(t.letters).toHaveLength(6)
    for (let i = 0; i < 6; i++) {
      expect(Note.chroma(t.letters[i]!), `${t.id} string ${i}`).toBe(t.strings[i]! % 12)
    }
  })

  const letterRows: Array<[string, string]> = [
    ['d-standard', 'DGCFAD'],
    ['c-standard', 'CFA#D#GC'],
    ['drop-d', 'DADGBE'],
    ['drop-c', 'CGCFAD'],
    ['drop-a', 'AADGBE'],
    ['double-drop-d', 'DADGBD'],
    ['open-a', 'EAEAC#E'],
    ['open-a-minor', 'EAEACE'],
    ['open-c', 'CGCGCE'],
    ['open-c6', 'CGCGAE'],
    ['open-d', 'DADF#AD'],
    ['open-d-minor', 'DADFAD'],
    ['open-d5', 'DADDAD'],
    ['open-e', 'EBEG#BE'],
    ['open-g', 'DGDGBD'],
    ['open-g-dobro', 'GBDGBD'],
    ['open-g-minor', 'DGDGA#D'],
    ['open-g6', 'DGDGBE'],
    ['celtic', 'DADGAD'],
    ['low-c', 'CGDGAD'],
    ['all-fourths', 'EADGCF'],
    ['nst', 'CGDAEG'],
  ]
  it.each(letterRows)('%s spells %s', (id, letters) => {
    expect(getTuning(id).letters.join('')).toBe(letters)
  })
})
