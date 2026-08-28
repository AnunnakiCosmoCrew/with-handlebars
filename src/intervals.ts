import { Interval } from 'tonal'
import type { DegreeToken } from './types.js'

export type ParsedDegree = {
  /** Token without optional parens, e.g. "b3". */
  token: DegreeToken
  optional: boolean
  /** Diatonic degree number, e.g. 3 for "b3", 11 for "#11". */
  degree: number
  /** tonal interval name, e.g. "3m", "11A", "7d". */
  intervalName: string
  /** Semitones from the root (not reduced to an octave; 13 → 21). */
  semitones: number
}

const PERFECT_DEGREES = new Set([1, 4, 5, 8, 11])

/** "b3" → "3m", "#11" → "11A", "bb7" → "7d", "5" → "5P", "13" → "13M". */
export function degreeToIntervalName(token: DegreeToken): string {
  const m = /^(#{1,2}|b{1,2})?(\d{1,2})$/.exec(token)
  if (!m) throw new Error(`bad degree token: ${token}`)
  const alt = m[1] ?? ''
  const degree = Number(m[2])
  const shift = alt.startsWith('#') ? alt.length : -alt.length
  const perfect = PERFECT_DEGREES.has(degree)
  const qualities: Record<number, string> = perfect
    ? { [-2]: 'dd', [-1]: 'd', 0: 'P', 1: 'A', 2: 'AA' }
    : { [-2]: 'd', [-1]: 'm', 0: 'M', 1: 'A', 2: 'AA' }
  const q = qualities[shift]
  if (!q) throw new Error(`bad alteration in degree token: ${token}`)
  return `${degree}${q}`
}

export function parseDegree(raw: DegreeToken): ParsedDegree {
  const optional = raw.startsWith('(') && raw.endsWith(')')
  const token = optional ? raw.slice(1, -1) : raw
  const intervalName = degreeToIntervalName(token)
  const semitones = Interval.semitones(intervalName)
  const degree = Number(/(\d{1,2})$/.exec(token)![1])
  return { token, optional, degree, intervalName, semitones }
}

export function parseDegreeList(tokens: DegreeToken[]): ParsedDegree[] {
  return tokens.map(parseDegree)
}
