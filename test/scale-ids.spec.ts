import { describe, expect, it } from 'vitest'
import { LEGACY_SCALE_IDS, SCALE_TYPES, getScaleType, resolveScaleId } from '../src/scales.js'

// Scale ids live in shared links and saved boards, so a renamed scale must keep
// answering to its old id (HB-174: "<name> Theta" became "<name> Thaat").
describe('scale ids', () => {
  const current = new Set(SCALE_TYPES.map(s => s.id))

  it('names the ten Hindustani parent scales "Thaat"', () => {
    const thaats = SCALE_TYPES.filter(s => s.name.endsWith(' Thaat'))
    expect(thaats).toHaveLength(10)
    expect(thaats.every(s => s.id.endsWith('-thaat'))).toBe(true)
    expect(SCALE_TYPES.some(s => /theta/i.test(s.name) || /theta/.test(s.id))).toBe(false)
  })

  it('maps every old "-theta" id to a current scale with the same intervals', () => {
    expect(LEGACY_SCALE_IDS.size).toBe(10)
    for (const [legacy, id] of LEGACY_SCALE_IDS) {
      expect(legacy).toMatch(/-theta$/)
      expect(current.has(legacy)).toBe(false)
      expect(current.has(id)).toBe(true)
      expect(resolveScaleId(legacy)).toBe(id)
      expect(getScaleType(legacy)).toBe(getScaleType(id))
    }
    expect(getScaleType('kafi-theta').intervals).toEqual(['1', '2', 'b3', '4', '5', '6', 'b7'])
  })

  it('passes current ids through and rejects unknown ones', () => {
    expect(resolveScaleId('major')).toBe('major')
    expect(resolveScaleId('todi-thaat')).toBe('todi-thaat')
    expect(resolveScaleId('no-such-scale')).toBeUndefined()
    expect(() => getScaleType('no-such-scale')).toThrow('unknown scale type')
  })
})
