import { describe, expect, it } from 'vitest'
import { Note } from 'tonal'
import { TUNINGS, getTuning } from '../src/tunings.js'

const guitarIds = [
  'standard',
  'd-standard',
  'c-standard',
  'drop-d',
  'drop-c',
  'drop-a',
  'double-drop-d',
  'open-a',
  'open-a-minor',
  'open-c',
  'open-c6',
  'open-d',
  'open-d-minor',
  'open-d5',
  'open-e',
  'open-g',
  'open-g-dobro',
  'open-g-minor',
  'open-g6',
  'celtic',
  'low-c',
  'all-fourths',
  'nst',
]
const guitar = TUNINGS.filter(t => guitarIds.includes(t.id))

describe('tuning presets', () => {
  it('has all 23 reference presets', () => {
    expect(guitar.map(t => t.id)).toEqual(guitarIds)
    for (const t of guitar) expect(t.strings).toHaveLength(6)
    expect(new Set(TUNINGS.map(t => t.id)).size).toBe(TUNINGS.length)
  })

  it('standard is EADGBE at the right octaves', () => {
    expect(getTuning('standard').strings).toEqual([40, 45, 50, 55, 59, 64])
    expect(getTuning('standard').letters).toEqual(['E', 'A', 'D', 'G', 'B', 'E'])
  })

  it.each(TUNINGS.map(t => [t.id, t] as const))('%s letters agree with MIDI', (_id, t) => {
    expect(t.letters).toHaveLength(t.strings.length)
    for (let i = 0; i < t.strings.length; i++) {
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

describe('instrument presets', () => {
  it.each([
    ['bass-4', 'bass', [28, 33, 38, 43], 'EADG'],
    ['bass-5', 'bass', [23, 28, 33, 38, 43], 'BEADG'],
    ['ukulele', 'ukulele', [67, 60, 64, 69], 'GCEA'],
    ['ukulele-low-g', 'ukulele', [55, 60, 64, 69], 'GCEA'],
    ['baritone', 'guitar', [35, 40, 45, 50, 54, 59], 'BEADF#B'],
    ['seven-standard', 'guitar', [35, 40, 45, 50, 55, 59, 64], 'BEADGBE'],
    ['seven-drop-a', 'guitar', [33, 40, 45, 50, 55, 59, 64], 'AEADGBE'],
  ] as const)('%s', (id, instrument, strings, letters) => {
    const t = getTuning(id)
    expect(t.instrument).toBe(instrument)
    expect(t.strings).toEqual(strings)
    expect(t.letters.join('')).toBe(letters)
  })

  it('leaves the 23 guitar presets without a non-guitar instrument', () => {
    for (const t of guitar) expect(t.instrument ?? 'guitar').toBe('guitar')
  })
})
