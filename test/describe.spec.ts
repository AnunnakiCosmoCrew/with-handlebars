import { describe, expect, it } from 'vitest'
import { describeSelection, intervalWords } from '../src/describe.js'
import type { Selection } from '../src/types.js'

const chord = (typeId: string, root = 'E'): Selection => ({ mode: 'chord', root, typeId })

describe('intervalWords', () => {
  const cases: Array<[string, string]> = [
    ['1P', 'perfect unison'],
    ['3M', 'major third'],
    ['3m', 'minor third'],
    ['5d', 'diminished fifth'],
    ['5A', 'augmented fifth'],
    ['7d', 'diminished seventh'],
    ['11A', 'augmented eleventh'],
    ['11AA', 'doubly augmented eleventh'],
    ['5dd', 'doubly diminished fifth'],
    ['13M', 'major thirteenth'],
  ]
  it.each(cases)('spells %s as %s', (name, words) => {
    expect(intervalWords(name)).toBe(words)
  })
})

describe('describeSelection — chords', () => {
  it('describes a major triad as stacked thirds', () => {
    const a = describeSelection(chord('major'))
    expect(a.tones.map(t => t.intervalWords)).toEqual([
      'perfect unison',
      'major third',
      'perfect fifth',
    ])
    expect(a.tones.map(t => t.note)).toEqual(['E', 'G#', 'B'])
    expect(a.thirds).toEqual(['major third', 'minor third'])
    expect(a.summary).toContain('stacking thirds')
  })

  it('stacks m7b5 and dim7 correctly', () => {
    expect(describeSelection(chord('m7b5')).thirds).toEqual([
      'minor third',
      'minor third',
      'major third',
    ])
    expect(describeSelection(chord('dim7')).thirds).toEqual([
      'minor third',
      'minor third',
      'minor third',
    ])
  })

  it('keeps the full thirteenth stack, optional tones included', () => {
    const a = describeSelection(chord('13'))
    expect(a.thirds).toHaveLength(6)
    expect(a.tones[1]!.optional).toBe(true)
    expect(a.tones.map(t => t.role)).toEqual([
      'root',
      'third',
      'fifth',
      'seventh',
      'extension',
      'extension',
      'extension',
    ])
  })

  it('refuses to call non-tertian chords a stack', () => {
    expect(describeSelection(chord('sus4')).thirds).toBeNull()
    expect(describeSelection(chord('6')).thirds).toBeNull()
    expect(describeSelection(chord('5')).thirds).toBeNull()
    expect(describeSelection(chord('sus4')).summary).toContain('Not a plain stack')
  })

  it('calls out the suspension replacing the third', () => {
    const four = describeSelection(chord('sus4')).tones.find(t => t.token === '4')!
    expect(four.comment).toContain('suspension')
    // the 11 of a 13 chord is NOT a suspension — a third is present
    const eleven = describeSelection(chord('13')).tones.find(t => t.token === '11')!
    expect(eleven.comment).not.toContain('suspension')
  })

  it('comments follow the interval quality', () => {
    const words = (typeId: string, token: string) =>
      describeSelection(chord(typeId)).tones.find(t => t.token === token)!.comment
    expect(words('m7', 'b3')).toContain('dark')
    expect(words('maj7', '3')).toContain('bright')
    expect(words('m7b5', 'b5')).toContain('tritone')
    expect(words('7', 'b7')).toContain('pull')
  })
})

describe('describeSelection — scales', () => {
  it('reads roles against the tonic and never stacks', () => {
    const a = describeSelection({ mode: 'scale', root: 'E', typeId: 'major' })
    expect(a.thirds).toBeNull()
    expect(a.tones.map(t => t.role)).toEqual([
      'root',
      'extension',
      'third',
      'extension',
      'fifth',
      'extension',
      'seventh',
    ])
    expect(a.summary).toContain('tonic')
  })

  it('spells per the spelling mode', () => {
    const strict = describeSelection(chord('maj7', 'F#'))
    const simple = describeSelection(chord('maj7', 'F#'), 'simple')
    expect(strict.tones[3]!.note).toBe('E#')
    expect(simple.tones[3]!.note).toBe('F')
  })
})
