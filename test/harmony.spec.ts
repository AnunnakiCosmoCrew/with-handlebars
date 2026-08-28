import { describe, expect, it } from 'vitest'
import { diatonicChords, type ScaleSelection } from '../src/harmony.js'

const scale = (root: string, typeId: string): ScaleSelection => ({ mode: 'scale', root, typeId })

const onDegree = (chords: ReturnType<typeof diatonicChords>, degreeIndex: number) =>
  chords.filter(c => c.degreeIndex === degreeIndex).map(c => c.typeId)

describe('diatonicChords', () => {
  it('finds the classic diatonic chords of the major scale', () => {
    const chords = diatonicChords(scale('C', 'major'))
    expect(onDegree(chords, 2)).toEqual(['minor', 'm7'])
    expect(onDegree(chords, 5)).toEqual(['major', '7'])
    expect(onDegree(chords, 5)).not.toContain('maj7')
    expect(onDegree(chords, 7)).toEqual(['dim', 'm7b5'])
    expect(chords.some(c => c.typeId === 'aug')).toBe(false)
  })

  it('spells chord roots with the scale, respecting the spelling mode', () => {
    const strict = diatonicChords(scale('F#', 'major'))
    expect(strict.find(c => c.degreeIndex === 7)!.root).toBe('E#')
    const simple = diatonicChords(scale('F#', 'major'), 'simple')
    expect(simple.find(c => c.degreeIndex === 7)!.root).toBe('F')
  })

  it('surfaces the harmonic-minor colors: aug on III, mmaj7 on i, dim7 on vii', () => {
    const chords = diatonicChords(scale('E', 'harmonic-minor'))
    expect(onDegree(chords, 3)).toContain('aug')
    expect(onDegree(chords, 1)).toContain('mmaj7')
    expect(onDegree(chords, 7)).toContain('dim7')
  })

  it('handles gap-heavy scales: pentatonic major hosts only two triads', () => {
    const chords = diatonicChords(scale('C', 'pentatonic-major'))
    // degreeIndex is the position in the interval list (1 2 3 5 6), so the
    // A chords sit at index 5, not diatonic degree 6
    expect(chords.map(c => [c.degreeIndex, c.root, c.typeId])).toEqual([
      [1, 'C', 'major'],
      [5, 'A', 'minor'],
      [5, 'A', 'm7'],
    ])
  })

  it('builds ASCII labels from root and chord symbol', () => {
    const chords = diatonicChords(scale('F#', 'major'))
    expect(chords.find(c => c.degreeIndex === 2 && c.typeId === 'm7')!.label).toBe('G#m7')
    expect(chords.find(c => c.degreeIndex === 1 && c.typeId === 'major')!.label).toBe('F#')
  })

  it('orders by scale degree, then curated type order', () => {
    const chords = diatonicChords(scale('C', 'major'))
    const indexes = chords.map(c => c.degreeIndex)
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b))
  })

  it('rejects chord selections at runtime, for JS callers past the types', () => {
    const chord = { mode: 'chord', root: 'C', typeId: 'major' } as unknown as ScaleSelection
    expect(() => diatonicChords(chord)).toThrow()
  })
})
