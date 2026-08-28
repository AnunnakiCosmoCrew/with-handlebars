import { describe, expect, it } from 'vitest'
import { degreeRole } from '../src/roles.js'
import { getChordType } from '../src/chords.js'
import { parseDegreeList } from '../src/intervals.js'
import { getFretboardDots } from '../src/fretboard.js'
import { STANDARD_TUNING } from '../src/tunings.js'
import type { Selection, ToneRole } from '../src/types.js'

const chordRoles = (typeId: string): ToneRole[] =>
  parseDegreeList(getChordType(typeId).intervals).map(degreeRole)

describe('degreeRole', () => {
  const cases: Array<[string, ToneRole]> = [
    ['1', 'root'],
    ['3', 'third'],
    ['b3', 'third'],
    ['#3', 'third'],
    ['5', 'fifth'],
    ['b5', 'fifth'],
    ['#5', 'fifth'],
    ['7', 'seventh'],
    ['b7', 'seventh'],
    ['bb7', 'seventh'],
    ['2', 'extension'],
    ['9', 'extension'],
    ['b9', 'extension'],
    ['#9', 'extension'],
    ['4', 'extension'],
    ['11', 'extension'],
    ['#11', 'extension'],
    ['6', 'extension'],
    ['13', 'extension'],
    ['b13', 'extension'],
  ]
  it.each(cases)('classifies %s as %s', (token, role) => {
    expect(degreeRole(token)).toBe(role)
  })

  it('accepts parsed degrees and keeps optional tones in their class', () => {
    const roles = parseDegreeList(['1', '(3)', '(5)', 'b7']).map(degreeRole)
    expect(roles).toEqual(['root', 'third', 'fifth', 'seventh'])
  })

  it('classifies whole chord types', () => {
    expect(chordRoles('m7b5')).toEqual(['root', 'third', 'fifth', 'seventh'])
    expect(chordRoles('aug')).toEqual(['root', 'third', 'fifth'])
    expect(chordRoles('13')).toEqual([
      'root',
      'third',
      'fifth',
      'seventh',
      'extension',
      'extension',
      'extension',
    ])
  })
})

describe('fretboard dots carry roles', () => {
  it('labels every dot with its degree role', () => {
    const selection: Selection = { mode: 'chord', root: 'E', typeId: '7' }
    const dots = getFretboardDots(STANDARD_TUNING, selection)
    const open = dots.find(d => d.string === 0 && d.fret === 0)!
    expect(open.role).toBe('root')
    const byDegree = new Map(dots.map(d => [d.degree, d.role]))
    expect(byDegree.get('3')).toBe('third')
    expect(byDegree.get('5')).toBe('fifth')
    expect(byDegree.get('b7')).toBe('seventh')
  })
})
