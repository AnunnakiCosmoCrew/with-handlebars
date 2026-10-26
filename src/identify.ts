import { CHORD_TYPES } from './chords.js'
import { parseDegreeList } from './intervals.js'
import { spellDegree } from './spelling.js'
import type { Tuning } from './types.js'

/**
 * Notes to identify. `midi` carries real pitches, so the lowest one is the
 * bass. `pitchClasses` (0–11, any integer is reduced mod 12) carries none:
 * the first entry is taken as the bass.
 */
export type IdentifyInput = { midi: number[] } | { pitchClasses: number[] }

export type IdentifyOptions = {
  /**
   * Force sharp or flat root spellings. By default the spelling needing fewer
   * accidentals wins, and equal counts go to flats (F# major comes back as Gb).
   */
  accidentals?: 'sharp' | 'flat'
  /** Keep at most this many candidates. */
  limit?: number
}

export type ChordCandidate = {
  /** Spelled root, e.g. "C#" or "Db". */
  root: string
  chordTypeId: string
  /** Display name, e.g. "Am7", "C/E". */
  name: string
  /** Spelled bass note. */
  bass: string
  /** True when the bass is not the root (a slash chord). */
  inversion: boolean
  /** Higher is better; candidates are returned best first. */
  score: number
}

export type FretPosition = {
  /** Index into tuning.strings (0 = lowest string). */
  string: number
  fret: number
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const mod12 = (n: number): number => ((n % 12) + 12) % 12

/** Larger than the penalties of any shape's optional tones combined, so score order matches the documented ranking. */
const BASS_ROOT_BONUS = 100
const MISSING_OPTIONAL_PENALTY = 4
const BASE_SCORE = 100

type Shape = {
  typeId: string
  symbol: string
  /** token → pitch class offset, in chord order, optional flag included. */
  tones: { token: string; pc: number; optional: boolean }[]
  required: Set<number>
  all: Set<number>
}

/** Listed first when two chord types share a tone set (add9(no3) is the same notes as sus2). */
const PREFERRED_TYPE_IDS = ['sus2']

/** One shape per distinct tone set: dim/mb5, aug/#5 and friends collapse to the first listed. */
const SHAPES: Shape[] = (() => {
  const seen = new Set<string>()
  const out: Shape[] = []
  const types = [
    ...PREFERRED_TYPE_IDS.flatMap(id => CHORD_TYPES.filter(t => t.id === id)),
    ...CHORD_TYPES.filter(t => !PREFERRED_TYPE_IDS.includes(t.id)),
  ]
  for (const type of types) {
    const tones = parseDegreeList(type.intervals).map(d => ({
      token: d.token,
      pc: mod12(d.semitones),
      optional: d.optional,
    }))
    const required = new Set(tones.filter(t => !t.optional).map(t => t.pc))
    const all = new Set(tones.map(t => t.pc))
    const key = `${[...required].sort((a, b) => a - b)}|${[...all].sort((a, b) => a - b)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ typeId: type.id, symbol: type.symbol, tones, required, all })
  }
  return out
})()

const accidentalCount = (note: string): number => note.length - 1

function spellRoot(pc: number, shape: Shape, accidentals?: 'sharp' | 'flat'): string {
  const sharp = SHARP_NAMES[pc]!
  const flat = FLAT_NAMES[pc]!
  if (sharp === flat) return sharp
  if (accidentals === 'sharp') return sharp
  if (accidentals === 'flat') return flat
  const cost = (root: string): number =>
    shape.tones.reduce((sum, t) => sum + accidentalCount(spellDegree(root, t.token)), accidentalCount(root))
  // Ties do happen (F# major and Gb major both cost three accidentals); flats
  // win them so the result stays deterministic.
  return cost(sharp) < cost(flat) ? sharp : flat
}

/**
 * Name the chords a set of notes could be. Every sounding pitch class must be a
 * tone of the chord and every required tone must sound (optional tones may be
 * absent). Candidates are ranked best first: a chord whose root is the bass
 * leads, fewer missing optional tones come next, then roots by ascending pitch
 * class, then chord order — so enharmonic and symmetric chords (dim7, aug)
 * always come back in the same order. Fewer than two distinct pitch classes
 * gives an empty list.
 */
export function identifyChords(input: IdentifyInput, opts: IdentifyOptions = {}): ChordCandidate[] {
  const raw = 'midi' in input ? input.midi : input.pitchClasses
  if (raw.length === 0) return []
  const bassValue = 'midi' in input ? Math.min(...raw) : raw[0]!
  const bassPc = mod12(bassValue)
  const present = new Set(raw.map(mod12))
  if (present.size < 2) return []

  const found: (ChordCandidate & { rootPc: number; order: number; missingOptional: number })[] = []
  for (const rootPc of [...present].sort((a, b) => a - b)) {
    SHAPES.forEach((shape, order) => {
      const rel = new Set([...present].map(pc => mod12(pc - rootPc)))
      for (const pc of rel) if (!shape.all.has(pc)) return
      for (const pc of shape.required) if (!rel.has(pc)) return
      const root = spellRoot(rootPc, shape, opts.accidentals)
      const bassTone = shape.tones.find(t => t.pc === mod12(bassPc - rootPc))!
      const bass = spellDegree(root, bassTone.token)
      const inversion = bassPc !== rootPc
      const missingOptional = shape.tones.filter(t => t.optional && !rel.has(t.pc)).length
      const score =
        BASE_SCORE - MISSING_OPTIONAL_PENALTY * missingOptional + (inversion ? 0 : BASS_ROOT_BONUS)
      found.push({
        root,
        chordTypeId: shape.typeId,
        name: `${root}${shape.symbol}${inversion ? `/${bass}` : ''}`,
        bass,
        inversion,
        score,
        rootPc,
        order,
        missingOptional,
      })
    })
  }

  found.sort(
    (a, b) =>
      Number(a.inversion) - Number(b.inversion) ||
      a.missingOptional - b.missingOptional ||
      a.rootPc - b.rootPc ||
      a.order - b.order,
  )
  const ranked = found.map(({ rootPc: _r, order: _o, missingOptional: _m, ...c }) => c)
  return opts.limit === undefined ? ranked : ranked.slice(0, Math.max(0, opts.limit))
}

/** Identify the chord held on the fretboard: positions → sounding MIDI notes → identifyChords. */
export function identifyFromPositions(
  tuning: Tuning,
  positions: FretPosition[],
  opts: IdentifyOptions = {},
): ChordCandidate[] {
  const midi = positions.map(({ string, fret }) => {
    const open = tuning.strings[string]
    if (open === undefined) throw new RangeError(`no string ${string} in tuning ${tuning.id}`)
    return open + fret
  })
  return identifyChords({ midi }, opts)
}
