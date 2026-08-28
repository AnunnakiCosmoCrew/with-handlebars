import { describe, expect, it } from 'vitest'
import { degreeToIntervalName, parseDegree } from '../src/intervals.js'
import { formatDegree, formatNote, simplifyNote, spellDegree, spellNote } from '../src/spelling.js'

describe('degree tokens', () => {
  const cases: Array<[string, string, number]> = [
    ['1', '1P', 0],
    ['b2', '2m', 1],
    ['2', '2M', 2],
    ['#2', '2A', 3],
    ['b3', '3m', 3],
    ['3', '3M', 4],
    ['4', '4P', 5],
    ['#4', '4A', 6],
    ['b5', '5d', 6],
    ['5', '5P', 7],
    ['#5', '5A', 8],
    ['b6', '6m', 8],
    ['6', '6M', 9],
    ['#6', '6A', 10],
    ['bb7', '7d', 9],
    ['b7', '7m', 10],
    ['7', '7M', 11],
    ['b9', '9m', 13],
    ['9', '9M', 14],
    ['#9', '9A', 15],
    ['11', '11P', 17],
    ['#11', '11A', 18],
    ['13', '13M', 21],
  ]
  it.each(cases)('%s → %s (%i semitones)', (token, name, semis) => {
    expect(degreeToIntervalName(token)).toBe(name)
    expect(parseDegree(token).semitones).toBe(semis)
  })

  it('parses optional tokens', () => {
    expect(parseDegree('(5)')).toMatchObject({ token: '5', optional: true, degree: 5 })
    expect(parseDegree('b7')).toMatchObject({ token: 'b7', optional: false, degree: 7 })
  })

  it('rejects garbage', () => {
    expect(() => degreeToIntervalName('x3')).toThrow()
    expect(() => degreeToIntervalName('')).toThrow()
  })
})

describe('spelling', () => {
  it('spells strictly from the root', () => {
    expect(spellDegree('E', '#9')).toBe('F##')
    expect(spellDegree('E', 'bb7')).toBe('Db')
    expect(spellDegree('C#', '3')).toBe('E#')
    expect(spellDegree('Db', '3')).toBe('F')
    expect(spellDegree('Gb', 'b5')).toBe('Dbb')
  })

  it('simplifies for the Simple mode', () => {
    expect(simplifyNote('F##')).toBe('G')
    expect(simplifyNote('Dbb')).toBe('C')
    expect(simplifyNote('E#')).toBe('F')
    expect(simplifyNote('Bb')).toBe('Bb')
    expect(spellNote('E', '#9', 'simple')).toBe('G')
    expect(spellNote('E', '#9', 'strict')).toBe('F##')
  })

  it('formats display glyphs', () => {
    expect(formatNote('F#')).toBe('F♯')
    expect(formatNote('Bb')).toBe('B♭')
    expect(formatNote('F##')).toBe('Fx')
    expect(formatNote('Dbb')).toBe('D♭♭')
    expect(formatNote('E')).toBe('E')
    expect(formatDegree('b9')).toBe('♭9')
    expect(formatDegree('#11')).toBe('♯11')
    expect(formatDegree('maj7#5')).toBe('maj7♯5')
  })
})
