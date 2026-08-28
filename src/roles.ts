import type { DegreeToken, ToneRole } from './types.js'
import { parseDegree, type ParsedDegree } from './intervals.js'

/**
 * Classify a degree by its harmonic role. The class comes from the diatonic
 * number alone, folded into one octave (9 → 2, 11 → 4, 13 → 6): 1 is the
 * root, 3 the third, 5 the fifth, 7 the seventh, and 2/4/6 are extensions.
 * Alterations never move a tone between classes — ♭5 and ♯5 are still the
 * fifth, 𝄫7 still the seventh, ♯11 still an extension.
 *
 * Caveat: the 4 of a sus4 chord classifies as an extension by this rule even
 * though it stands in for the third; describeSelection covers that in prose.
 */
export function degreeRole(d: ParsedDegree | DegreeToken): ToneRole {
  const degree = typeof d === 'string' ? parseDegree(d).degree : d.degree
  const n = ((degree - 1) % 7) + 1
  switch (n) {
    case 1:
      return 'root'
    case 3:
      return 'third'
    case 5:
      return 'fifth'
    case 7:
      return 'seventh'
    default:
      return 'extension'
  }
}
