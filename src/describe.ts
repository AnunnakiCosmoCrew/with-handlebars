import type { DegreeToken, Selection, SpellingMode, ToneRole } from './types.js'
import { parseDegreeList, type ParsedDegree } from './intervals.js'
import { getChordType } from './chords.js'
import { getScaleType } from './scales.js'
import { spellNote } from './spelling.js'
import { degreeRole } from './roles.js'

export type ToneDescription = {
  /** Degree token without optional parens, e.g. "b3". */
  token: DegreeToken
  optional: boolean
  role: ToneRole
  /** Spelled note per the spelling mode, ASCII accidentals. */
  note: string
  /** Interval spelled out, e.g. "minor third". */
  intervalWords: string
  /** Semitones above the root (not octave-reduced). */
  semitones: number
  /** One plain-words line on what the tone does for the sound. */
  comment: string
}

export type SelectionAnatomy = {
  tones: ToneDescription[]
  /**
   * Adjacent-pair interval words when the selection is a strict stack of
   * thirds (every step climbs exactly two degrees), else null. Scales are
   * always null — they step, they don't stack.
   */
  thirds: string[] | null
  /** One generated sentence framing how to read the tones. */
  summary: string
}

const QUALITY_WORDS: Record<string, string> = {
  dd: 'doubly diminished',
  d: 'diminished',
  m: 'minor',
  M: 'major',
  P: 'perfect',
  A: 'augmented',
  AA: 'doubly augmented',
}

const ORDINAL_WORDS: Record<number, string> = {
  1: 'unison',
  2: 'second',
  3: 'third',
  4: 'fourth',
  5: 'fifth',
  6: 'sixth',
  7: 'seventh',
  8: 'octave',
  9: 'ninth',
  10: 'tenth',
  11: 'eleventh',
  12: 'twelfth',
  13: 'thirteenth',
}

/** "3m" → "minor third", "11A" → "augmented eleventh", "1P" → "perfect unison". */
export function intervalWords(intervalName: string): string {
  const m = /^(\d{1,2})(dd|AA|d|m|M|P|A)$/.exec(intervalName)
  if (!m) throw new Error(`bad interval name: ${intervalName}`)
  const ordinal = ORDINAL_WORDS[Number(m[1])]
  if (!ordinal) throw new Error(`bad interval name: ${intervalName}`)
  return `${QUALITY_WORDS[m[2]!]} ${ordinal}`
}

/** Quality letter(s) of a tonal interval name: "3m" → "m". */
const qualityOf = (intervalName: string): string =>
  /(dd|AA|d|m|M|P|A)$/.exec(intervalName)![1]!

const ROLE_COMMENTS: Record<string, string> = {
  'root': 'home base — every other tone is measured from here',
  'third:M': 'the quality tone — a major third makes the sound bright',
  'third:m': 'the quality tone — a minor third makes the sound dark',
  'fifth:P': 'the frame — a perfect fifth steadies the root',
  'fifth:d': 'a tritone against the root — tension that wants to resolve',
  'fifth:A': 'a raised fifth — stretches the frame, restless and unresolved',
  'seventh:m': 'the pull tone — a minor seventh leans toward the next chord',
  'seventh:M': 'a major seventh — sits a half-step under home, lush and open',
  'seventh:d': 'a diminished seventh — deepens the pull into full suspense',
  'extension': 'a color tone — flavor stacked above the core chord',
}

const ROLE_FALLBACKS: Record<ToneRole, string> = {
  root: ROLE_COMMENTS['root']!,
  third: 'the quality tone — this degree decides how the chord feels',
  fifth: 'the frame of the chord around the root',
  seventh: 'the pull tone — this degree points the chord somewhere',
  extension: ROLE_COMMENTS['extension']!,
}

function toneComment(d: ParsedDegree, role: ToneRole, hasThird: boolean, isChord: boolean): string {
  const n = ((d.degree - 1) % 7) + 1
  if (isChord && !hasThird && role === 'extension' && (n === 2 || n === 4)) {
    return 'the suspension — takes the third’s place and waits to resolve'
  }
  if (role === 'root') return ROLE_COMMENTS['root']!
  return ROLE_COMMENTS[`${role}:${qualityOf(d.intervalName)}`] ?? ROLE_FALLBACKS[role]
}

/** Interval words for a stacked pair, from its semitone gap; null if not a third. */
const THIRD_WORDS: Record<number, string> = {
  2: 'diminished third',
  3: 'minor third',
  4: 'major third',
  5: 'augmented third',
}

/**
 * Explain how a selection is built: each tone's interval in words, its
 * harmonic role, and — for tertian chords — the stack of thirds. Everything
 * is derived from the interval formula; nothing is authored per chord.
 */
export function describeSelection(
  selection: Selection,
  spelling: SpellingMode = 'strict',
): SelectionAnatomy {
  const isChord = selection.mode === 'chord'
  const type = isChord ? getChordType(selection.typeId) : getScaleType(selection.typeId)
  const degrees = parseDegreeList(type.intervals)
  const roles = degrees.map(degreeRole)
  const hasThird = roles.includes('third')

  const tones: ToneDescription[] = degrees.map((d, i) => ({
    token: d.token,
    optional: d.optional,
    role: roles[i]!,
    note: spellNote(selection.root, d.token, spelling),
    intervalWords: intervalWords(d.intervalName),
    semitones: d.semitones,
    comment: toneComment(d, roles[i]!, hasThird, isChord),
  }))

  let thirds: string[] | null = null
  if (isChord && degrees.length >= 2) {
    const steps: string[] = []
    for (let i = 1; i < degrees.length; i++) {
      const prev = degrees[i - 1]!
      const cur = degrees[i]!
      const word = THIRD_WORDS[cur.semitones - prev.semitones]
      if (cur.degree - prev.degree !== 2 || !word) {
        thirds = null
        break
      }
      steps.push(word)
      thirds = steps
    }
  }

  const summary = !isChord
    ? `A ${degrees.length}-note scale — roles are read against the tonic, ${selection.root}.`
    : thirds
      ? `Built by stacking thirds on ${selection.root}.`
      : `Not a plain stack of thirds — read each tone’s role below.`

  return { tones, thirds, summary }
}
