import { describe, expect, it } from 'vitest'
import { PROGRESSION_PRESETS, progressionSteps } from '../src/index.js'
import type { ScaleSelection } from '../src/harmony.js'

const scale = (root: string, typeId: string): ScaleSelection => ({ mode: 'scale', root, typeId })

describe('progressionSteps', () => {
  it('harmonizes I–IV–V triads in C major', () => {
    const steps = progressionSteps(scale('C', 'major'), [1, 4, 5])
    expect(steps.map(s => s.root)).toEqual(['C', 'F', 'G'])
    expect(steps.map(s => s.chord?.typeId)).toEqual(['major', 'major', 'major'])
    expect(steps.map(s => s.numeral)).toEqual(['I', 'IV', 'V'])
    expect(steps[0]!.midi).toEqual([48, 52, 55])
    expect(steps[1]!.midi).toEqual([53, 57, 60])
    expect(steps[2]!.midi).toEqual([55, 59, 62])
  })

  it('harmonizes ii–V–I sevenths in C major', () => {
    const steps = progressionSteps(scale('C', 'major'), [2, 5, 1], { sevenths: true })
    expect(steps.map(s => s.chord?.label)).toEqual(['Dm7', 'G7', 'Cmaj7'])
    expect(steps.map(s => s.numeral)).toEqual(['ii7', 'V7', 'Imaj7'])
    expect(steps[1]!.midi).toEqual([55, 59, 62, 65])
  })

  it('gets the harmonic-minor dominant right', () => {
    const [v] = progressionSteps(scale('A', 'harmonic-minor'), [5], { sevenths: true })
    expect(v!.root).toBe('E')
    expect(v!.chord?.typeId).toBe('7')
    expect(v!.numeral).toBe('V7')
    const [i, vii] = progressionSteps(scale('A', 'harmonic-minor'), [1, 7], { sevenths: false })
    expect(i!.numeral).toBe('i')
    expect(vii!.root).toBe('G#')
    expect(vii!.chord?.typeId).toBe('dim')
    expect(vii!.numeral).toBe('vii°')
  })

  it('spells roots per the scale, not enharmonically', () => {
    const [vii] = progressionSteps(scale('F#', 'major'), [7])
    expect(vii!.root).toBe('E#')
    expect(vii!.numeral).toBe('vii°')
  })

  it('falls back to a bare numeral when the stack is not a curated type', () => {
    // Enigmatic degree 2 stacks 1-#4-#6 over b2: no tertian overlay type.
    const [ii] = progressionSteps(scale('C', 'enigmatic'), [2])
    expect(ii!.chord).toBeNull()
    expect(ii!.numeral).toBe('bII')
  })

  it('rejects non-heptatonic scales and bad degrees', () => {
    expect(() => progressionSteps(scale('C', 'pentatonic-major'), [1])).toThrow(/7-note/)
    expect(() => progressionSteps(scale('H', 'major'), [1])).toThrow(/root/)
    expect(() => progressionSteps(scale('C', 'major'), [0])).toThrow(/degree/)
    expect(() => progressionSteps(scale('C', 'major'), [8])).toThrow(/degree/)
  })

  it('voice-leads later chords to the nearest inversion when asked', () => {
    const steps = progressionSteps(scale('C', 'major'), [1, 4, 5], { voiceLeading: true })
    // I stays root position; IV and V pivot around it instead of leaping.
    expect(steps[0]!.midi).toEqual([48, 52, 55]) // C E G
    expect(steps[1]!.midi).toEqual([48, 53, 57]) // C F A — second inversion
    expect(steps[2]!.midi).toEqual([47, 50, 55]) // B D G — first inversion
    // identity is untouched by the voicing
    expect(steps.map(s => s.numeral)).toEqual(['I', 'IV', 'V'])
    expect(steps.map(s => s.root)).toEqual(['C', 'F', 'G'])
  })

  it('voice-leads sevenths too', () => {
    const steps = progressionSteps(scale('C', 'major'), [2, 5, 1], {
      sevenths: true,
      voiceLeading: true,
    })
    expect(steps[0]!.midi).toEqual([50, 53, 57, 60]) // Dm7 root position
    expect(steps[1]!.midi).toEqual([50, 53, 55, 59]) // G7 third inversion: F on top becomes B
    expect(steps[2]!.midi).toEqual([48, 52, 55, 59]) // Cmaj7 resolves to root position
    expect(steps.map(s => s.chord?.label)).toEqual(['Dm7', 'G7', 'Cmaj7'])
  })

  it('keeps every voice-led voicing the same pitch-class set as root position', () => {
    for (const preset of PROGRESSION_PRESETS) {
      const plain = progressionSteps(scale('G', 'major'), preset.degrees)
      const led = progressionSteps(scale('G', 'major'), preset.degrees, { voiceLeading: true })
      led.forEach((s, i) => {
        const classes = (m: number[]) => new Set(m.map(n => n % 12))
        expect(classes(s.midi)).toEqual(classes(plain[i]!.midi))
        // ascending and in a playable register
        expect([...s.midi].sort((a, b) => a - b)).toEqual(s.midi)
        expect(s.midi[0]!).toBeGreaterThanOrEqual(28)
        expect(s.midi[0]!).toBeLessThanOrEqual(72)
      })
    }
  })

  it('ships the classic presets', () => {
    const ids = PROGRESSION_PRESETS.map(p => p.id)
    expect(ids).toContain('i-iv-v')
    expect(ids).toContain('ii-v-i')
    expect(ids).toContain('blues-12')
    expect(ids).toContain('i-vi-ii-v')
    expect(ids).toContain('pachelbel')
    expect(ids).toContain('andalusian')
    expect(ids).toContain('blues-minor-12')
    // the Andalusian cadence reads i–bVII–bVI–v against a minor scale
    const and = PROGRESSION_PRESETS.find(p => p.id === 'andalusian')!
    const steps = progressionSteps(scale('A', 'aeolian'), and.degrees)
    expect(steps.map(s => s.numeral)).toEqual(['i', 'bVII', 'bVI', 'v'])
    // minor blues lands its bVI–V turnaround in harmonic minor
    const mb = PROGRESSION_PRESETS.find(p => p.id === 'blues-minor-12')!
    const mbSteps = progressionSteps(scale('A', 'harmonic-minor'), mb.degrees)
    expect(mbSteps.slice(8, 10).map(s => s.numeral)).toEqual(['bVI', 'V'])
    const blues = PROGRESSION_PRESETS.find(p => p.id === 'blues-12')!
    expect(blues.degrees).toHaveLength(12)
    expect(blues.degrees.slice(8)).toEqual([5, 4, 1, 5])
    // every preset resolves cleanly in a major key
    for (const preset of PROGRESSION_PRESETS) {
      const steps = progressionSteps(scale('G', 'major'), preset.degrees)
      expect(steps).toHaveLength(preset.degrees.length)
      expect(steps.every(s => s.chord !== null)).toBe(true)
    }
  })
})
